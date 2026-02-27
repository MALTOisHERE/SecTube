import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import Comment from '../../../src/models/Comment.js';

test('Comment Model Logic', async (t) => {
  await t.test('should be invalid if required fields are missing', () => {
    const comment = new Comment();
    const error = comment.validateSync();
    
    assert.ok(error.errors.video, 'video is required');
    assert.ok(error.errors.user, 'user is required');
    assert.ok(error.errors.content, 'content is required');
  });

  await t.test('should be invalid if content exceeds maxlength', () => {
    const longContent = 'a'.repeat(1001);
    const comment = new Comment({
      video: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      content: longContent
    });
    
    const error = comment.validateSync();
    assert.ok(error.errors.content);
    assert.ok(error.errors.content.message.includes('cannot exceed 1000 characters'));
  });

  await t.test('should have default values set correctly', () => {
    const comment = new Comment({
      video: new mongoose.Types.ObjectId(),
      user: new mongoose.Types.ObjectId(),
      content: 'Valid content'
    });
    
    assert.strictEqual(comment.isEdited, false);
    assert.strictEqual(comment.isPinned, false);
    assert.strictEqual(comment.isDeleted, false);
    assert.strictEqual(comment.parentComment, null);
    assert.ok(comment.createdAt);
    assert.ok(comment.updatedAt);
  });
});
