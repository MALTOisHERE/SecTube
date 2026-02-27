import test from 'node:test';
import assert from 'node:assert';
import useChatbotStore from '../../../src/store/chatbotStore.js';

test('Chatbot Store Logic', async (t) => {
  t.beforeEach(() => {
    useChatbotStore.setState({ isOpen: false });
  });

  await t.test('initial state should be closed', () => {
    assert.strictEqual(useChatbotStore.getState().isOpen, false);
  });

  await t.test('toggleChatbot should work', () => {
    useChatbotStore.getState().toggleChatbot();
    assert.strictEqual(useChatbotStore.getState().isOpen, true);
    
    useChatbotStore.getState().toggleChatbot();
    assert.strictEqual(useChatbotStore.getState().isOpen, false);
  });
});
