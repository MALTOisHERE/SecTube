import test from 'node:test';
import assert from 'node:assert';
import { toolExecutor } from '../../../../src/services/ai/tools/toolExecutor.js';

test('Tool Executor Logic', async (t) => {
  const availableTools = [
    {
      name: 'get_videos',
      _metadata: { path: '/api/videos', method: 'get' }
    },
    {
      name: 'get_video_by_id',
      _metadata: { path: '/api/videos/{id}', method: 'get' }
    }
  ];

  await t.test('should handle missing tool', async () => {
    const toolCall = { function: { name: 'non_existent_tool' } };
    const result = await toolExecutor.execute(toolCall, null, availableTools);
    assert.strictEqual(result, 'Tool non_existent_tool not found');
  });

  await t.test('should handle string arguments for parsing', async () => {
    const toolCall = {
      function: {
        name: 'get_video_by_id',
        arguments: JSON.stringify({ id: '123' })
      }
    };
    
    process.env.BACKEND_URL = 'http://invalid-url.local';
    const result = await toolExecutor.execute(toolCall, 'fake-token', availableTools);
    assert.ok(result.includes('Error executing tool'));
  });

  await t.test('should correctly handle object arguments', async () => {
    const toolCall = {
      function: {
        name: 'get_video_by_id',
        arguments: { id: '456' } 
      }
    };
    
    const result = await toolExecutor.execute(toolCall, null, availableTools);
    assert.ok(result.includes('Error executing tool'));
  });
});
