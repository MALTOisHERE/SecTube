import { create } from 'zustand';

const useChatbotStore = create((set) => ({
  isOpen: false,
  toggleChatbot: () => set((state) => ({ isOpen: !state.isOpen })),
  closeChatbot: () => set({ isOpen: false }),
  openChatbot: () => set({ isOpen: true }),
}));

export default useChatbotStore;
