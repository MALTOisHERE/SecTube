import test from 'node:test';
import assert from 'node:assert';
import useSidebarStore from '../../../src/store/sidebarStore.js';

test('Sidebar Store Logic', async (t) => {
  t.beforeEach(() => {
    useSidebarStore.setState({ isOpen: false });
  });

  await t.test('initial state should be closed', () => {
    assert.strictEqual(useSidebarStore.getState().isOpen, false);
  });

  await t.test('openSidebar should open it', () => {
    useSidebarStore.getState().openSidebar();
    assert.strictEqual(useSidebarStore.getState().isOpen, true);
  });

  await t.test('closeSidebar should close it', () => {
    useSidebarStore.setState({ isOpen: true });
    useSidebarStore.getState().closeSidebar();
    assert.strictEqual(useSidebarStore.getState().isOpen, false);
  });

  await t.test('toggleSidebar should flip the state', () => {
    useSidebarStore.getState().toggleSidebar();
    assert.strictEqual(useSidebarStore.getState().isOpen, true);
    
    useSidebarStore.getState().toggleSidebar();
    assert.strictEqual(useSidebarStore.getState().isOpen, false);
  });
});
