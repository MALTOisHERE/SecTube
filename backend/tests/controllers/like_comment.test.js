
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { likeComment } from '../src/controllers/videos.js';
import Comment from '../src/models/Comment.js';

// Mock dependencies if necessary, but we are using MemoryServer
// We need to mock 'res' and 'req'

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
};

async function verifyImplementation() {
  console.log('Starting Verification...');
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create dummy user and comment
  const userId = new mongoose.Types.ObjectId();
  const videoId = new mongoose.Types.ObjectId(); // Required by schema

  const comment = await Comment.create({
    video: videoId,
    user: userId,
    content: 'Test comment',
    likes: []
  });

  const commentId = comment._id;

  // Test Case 1: Like the comment (was not liked)
  console.log('Test 1: Like Comment');
  const req1 = {
    params: { commentId: commentId.toString() },
    user: { id: userId.toString() }
  };
  const res1 = mockRes();

  await likeComment(req1, res1, (err) => { console.error('Error:', err); });

  if (res1.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${res1.statusCode}`);
  }
  if (!res1.body.success) {
    throw new Error('Expected success: true');
  }
  if (res1.body.data.isLiked !== true) {
    throw new Error('Expected isLiked: true');
  }
  if (res1.body.data.likes !== 1) {
    throw new Error(`Expected likes: 1, got ${res1.body.data.likes}`);
  }

  // Verify DB state
  const dbComment1 = await Comment.findById(commentId);
  if (dbComment1.likes.length !== 1 || dbComment1.likes[0].toString() !== userId.toString()) {
     throw new Error('DB state incorrect after like');
  }
  console.log('Test 1 Passed');

  // Test Case 2: Unlike the comment (was liked)
  console.log('Test 2: Unlike Comment');
  const req2 = {
    params: { commentId: commentId.toString() },
    user: { id: userId.toString() }
  };
  const res2 = mockRes();

  await likeComment(req2, res2, (err) => { console.error('Error:', err); });

  if (res2.statusCode !== 200) {
    throw new Error(`Expected status 200, got ${res2.statusCode}`);
  }
  if (res2.body.data.isLiked !== false) {
    throw new Error('Expected isLiked: false');
  }
  if (res2.body.data.likes !== 0) {
    throw new Error(`Expected likes: 0, got ${res2.body.data.likes}`);
  }

  // Verify DB state
  const dbComment2 = await Comment.findById(commentId);
  if (dbComment2.likes.length !== 0) {
     throw new Error('DB state incorrect after unlike');
  }
  console.log('Test 2 Passed');

  // Test Case 3: Comment not found
  console.log('Test 3: Comment Not Found');
  const req3 = {
    params: { commentId: new mongoose.Types.ObjectId().toString() },
    user: { id: userId.toString() }
  };
  const res3 = mockRes();

  await likeComment(req3, res3, (err) => { console.error('Error:', err); });

  if (res3.statusCode !== 404) {
    throw new Error(`Expected status 404, got ${res3.statusCode}`);
  }
  console.log('Test 3 Passed');

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('All tests passed!');
}

verifyImplementation().catch(console.error);
