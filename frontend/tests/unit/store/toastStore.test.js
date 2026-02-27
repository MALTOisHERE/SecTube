import test from 'node:test';
import assert from 'node:assert';
import useToastStore from '../../../src/store/toastStore.js';

test('Toast Store Logic', async (t) => {
  t.beforeEach(() => {
    // Reset store state
    useToastStore.setState({ toasts: [] });
  });

  await t.test('addToast should add a new toast with default values', () => {
    const id = useToastStore.getState().addToast({ message: 'Test message' });
    const state = useToastStore.getState();
    
    assert.strictEqual(state.toasts.length, 1);
    assert.strictEqual(state.toasts[0].id, id);
    assert.strictEqual(state.toasts[0].message, 'Test message');
    assert.strictEqual(state.toasts[0].type, 'info');
    assert.strictEqual(state.toasts[0].duration, 5000);
  });

  await t.test('removeToast should remove a toast by id', () => {
    const id = useToastStore.getState().addToast({ message: 'To remove' });
    assert.strictEqual(useToastStore.getState().toasts.length, 1);
    
    useToastStore.getState().removeToast(id);
    assert.strictEqual(useToastStore.getState().toasts.length, 0);
  });

  await t.test('success helper should add a success toast', () => {
    // Note: the current implementation of success/error/warning/info in toastStore.js 
    // actually has a bug where it tries to call state.addToast inside set(), 
    // but addToast is part of the state, not the set function's state argument in that way.
    // Let's see if it works or if we found a bug to fix.
    
    try {
      useToastStore.getState().success('Success message');
      const state = useToastStore.getState();
      assert.strictEqual(state.toasts[0].type, 'success');
      assert.strictEqual(state.toasts[0].message, 'Success message');
    } catch (e) {
      assert.fail('Toast helper methods failed: ' + e.message);
    }
  });

  await t.test('toasts should be removed after duration', async () => {
    const id = useToastStore.getState().addToast({ message: 'Quick toast', duration: 10 });
    assert.strictEqual(useToastStore.getState().toasts.length, 1);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    assert.strictEqual(useToastStore.getState().toasts.length, 0);
  });
});
