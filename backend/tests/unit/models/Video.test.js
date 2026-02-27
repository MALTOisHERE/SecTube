import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import Video from '../../../src/models/Video.js';

test('Video Model Logic', async (t) => {

  await t.test('should be invalid if required fields are missing', () => {
    const video = new Video();
    const error = video.validateSync();
    
    assert.ok(error.errors.title);
    assert.ok(error.errors.description);
    assert.ok(error.errors.uploader);
    assert.ok(error.errors.thumbnail);
    assert.ok(error.errors.duration);
    assert.ok(error.errors.category);
  });

  await t.test('should be invalid if category is not in enum', () => {
    const video = new Video({
      title: 'Valid Title',
      description: 'Valid Desc',
      uploader: new mongoose.Types.ObjectId(),
      thumbnail: 'thumb.jpg',
      duration: 120,
      category: 'Invalid Category'
    });
    
    const error = video.validateSync();
    assert.ok(error.errors.category);
    assert.ok(error.errors.category.message.includes('enum'));
  });

  await t.test('should calculate virtuals correctly', () => {
    const video = new Video({
      likes: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      dislikes: [new mongoose.Types.ObjectId()]
    });

    assert.strictEqual(video.likeCount, 2);
    assert.strictEqual(video.dislikeCount, 1);
  });

  await t.test('should handle empty likes and dislikes correctly', () => {
    const video = new Video();
    assert.strictEqual(video.likeCount, 0);
    assert.strictEqual(video.dislikeCount, 0);
  });
});
