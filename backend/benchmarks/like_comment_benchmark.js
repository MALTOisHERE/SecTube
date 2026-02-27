
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const CommentSchema = new mongoose.Schema({
  likes: [{ type: mongoose.Schema.Types.ObjectId }]
});
const Comment = mongoose.model('Comment', CommentSchema);

async function runBenchmark() {
  console.log('Starting...');
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const userId = new mongoose.Types.ObjectId();
  const comment = new Comment({ likes: [] });
  await comment.save();
  const commentId = comment._id;

  console.log('Starting Baseline (100 iterations)...');
  const startBaseline = Date.now();
  for (let i = 0; i < 100; i++) {
    const doc = await Comment.findById(commentId);
    if (!doc) throw new Error('Comment not found');
    const index = doc.likes.findIndex(id => id.toString() === userId.toString());
    if (index > -1) doc.likes.splice(index, 1);
    else doc.likes.push(userId);
    await doc.save();
  }
  const baselineTime = Date.now() - startBaseline;
  console.log(`Baseline (findById + save): ${baselineTime} ms`);

  await Comment.findByIdAndUpdate(commentId, { likes: [] });

  console.log('Starting Optimized (100 iterations)...');
  const startOptimized = Date.now();
  for (let i = 0; i < 100; i++) {
    await Comment.findByIdAndUpdate(
      commentId,
      [
        {
          $set: {
            likes: {
              $cond: [
                { $in: [userId, "$likes"] },
                { $setDifference: ["$likes", [userId]] },
                { $concatArrays: ["$likes", [userId]] }
              ]
            }
          }
        }
      ],
      { returnDocument: 'after', updatePipeline: true }
    );
  }
  const optimizedTime = Date.now() - startOptimized;
  console.log(`Optimized (findByIdAndUpdate): ${optimizedTime} ms`);

  const improvement = ((baselineTime - optimizedTime) / baselineTime * 100).toFixed(2);
  console.log(`Improvement: ${improvement}% faster`);

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('Done');
}

runBenchmark().catch(console.error);
