import { create } from 'zustand';

const STORAGE_KEY = 'sectube_chat_history';

const useChatbotStore = create((set) => ({
  isOpen: false,
  messages: (() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to load chat history:', e);
        }
      }
    }
    return [
      {
        role: 'assistant',
        content: "Hi! I'm the **SecTube AI Assistant**. How can I help you today?"
      }
    ];
  })(),

  toggleChatbot: () => set((state) => ({ isOpen: !state.isOpen })),
  closeChatbot: () => set({ isOpen: false }),
  openChatbot: () => set({ isOpen: true }),

  addMessage: (message) => set((state) => {
    const newMessages = [...state.messages, message];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    }
    return { messages: newMessages };
  }),

  setMessages: (messages) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    set({ messages });
  },

  clearMessages: () => {
    const welcomeMessage = [
      {
        role: 'assistant',
        content: "Hi! I'm the **SecTube AI Assistant**. How can I help you today?"
      }
    ];
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(welcomeMessage));
    }
    set({ messages: welcomeMessage });
  },
}));

export default useChatbotStore;
