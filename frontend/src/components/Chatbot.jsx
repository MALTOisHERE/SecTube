import { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaSpinner, FaTrash, FaUser } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { getAvatarUrl } from '../config/constants';
import ConfirmDialog from './ConfirmDialog';

const STORAGE_KEY = 'sectube_chat_history';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
    // Default welcome message
    return [
      {
        role: 'assistant',
        content: 'Hi! I\'m the **SecTube AI Assistant**. I can help you:\n\n- Find cybersecurity videos\n- Get recommendations based on your interests\n- Answer questions about security topics\n- Navigate the platform\n\nWhat would you like to know?'
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const { token, user } = useAuthStore();
  const { addToast } = useToastStore();

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/chat`,
        { messages: [...messages, userMessage] },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      const assistantMessage = response.data.message;
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get AI response. Please try again.';
      addToast({
        type: 'error',
        message: errorMessage,
      });
      // Optionally show error in chat
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an error while processing your request. Please try again or rephrase your question.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    const welcomeMessage = {
      role: 'assistant',
      content: 'Hi! I\'m the **SecTube AI Assistant**. I can help you:\n\n- Find cybersecurity videos\n- Get recommendations based on your interests\n- Answer questions about security topics\n- Navigate the platform\n\nWhat would you like to know?'
    };
    setMessages([welcomeMessage]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([welcomeMessage]));
    addToast({
      type: 'info',
      message: 'Chat history cleared',
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(14,165,233,0.3)] z-[1000] border border-primary-500/30"
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <FaTimes size={20} />
        ) : (
          <div className="relative">
            <FaRobot size={20} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-dark-900 border border-dark-700 rounded-md shadow-2xl flex flex-col z-[1000] animate-fadeIn">
          {/* Header */}
          <div className="bg-dark-900 border-b border-dark-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <FaRobot size={16} className="text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-dark-900 animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">SecTube AI</h3>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 hover:bg-dark-800 rounded-md transition-colors text-gray-500 hover:text-gray-300"
              title="Clear chat history"
            >
              <FaTrash size={14} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    user?.avatar ? (
                      <img
                        src={getAvatarUrl(user.avatar)}
                        alt="You"
                        className="w-7 h-7 rounded-full border border-dark-700 object-cover"
                        onError={(e) => {
                          e.target.src = '/default-avatar.svg';
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 bg-dark-800 rounded-full flex items-center justify-center border border-dark-700">
                        <FaUser size={14} className="text-gray-500" />
                      </div>
                    )
                  ) : (
                    <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center border border-primary-500/30">
                      <FaRobot size={14} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white rounded-md border border-primary-500/30'
                      : 'bg-dark-800 text-gray-200 rounded-md border border-dark-700'
                  }`}
                >
                  <div className={`prose prose-sm max-w-none ${
                    message.role === 'user'
                      ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-li:text-white prose-a:text-white'
                      : 'prose-headings:text-gray-100 prose-p:text-gray-200 prose-strong:text-primary-400 prose-a:text-primary-400 hover:prose-a:text-primary-300 prose-li:text-gray-200 prose-code:text-primary-400 prose-code:bg-dark-900 prose-code:px-1 prose-code:rounded'
                  }`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center border border-primary-500/30">
                  <FaRobot size={14} className="text-white" />
                </div>
                <div className="bg-dark-800 border border-dark-700 px-3 py-2 rounded-md">
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-primary-500" size={14} />
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-dark-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 bg-dark-900 border border-dark-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-800 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-md transition-colors border border-primary-500/30 disabled:border-dark-700"
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear History Confirmation */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearHistory}
        title="Clear Chat History?"
        message="This will permanently delete all your chat messages. This action cannot be undone."
        confirmText="Clear History"
        cancelText="Cancel"
        type="warning"
      />
    </>
  );
};

export default Chatbot;
