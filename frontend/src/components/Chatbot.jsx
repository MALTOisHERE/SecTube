import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FaMagic, FaRobot, FaTimes, FaPaperPlane, FaSpinner, FaTrash, FaUser, FaInfoCircle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import useChatbotStore from '../store/chatbotStore';
import { getAvatarUrl } from '../config/constants';
import ConfirmDialog from './ConfirmDialog';
import Z_INDEX from '../config/zIndex';

const STORAGE_KEY = 'sectube_chat_history';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Chatbot = () => {
  const { isOpen, toggleChatbot, closeChatbot } = useChatbotStore();
  const location = useLocation();
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
        content: "Hi! I'm the **SecTube AI Assistant**. How can I help you today?"
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const { token, user } = useAuthStore();
  const { addToast } = useToastStore();

  // Close on navigation
  useEffect(() => {
    closeChatbot();
  }, [location.pathname, closeChatbot]);

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
      content: "Hi! I'm the **SecTube AI Assistant**. How can I help you today?"
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
      {/* Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 top-14 transition-opacity duration-300"
          onClick={toggleChatbot}
          style={{ zIndex: Z_INDEX.SIDEBAR_OVERLAY }}
        />
      )}

      {/* Chat Drawer */}
      <div 
        className={`fixed top-14 bottom-0 right-0 w-full sm:w-[500px] bg-dark-900 border-l border-dark-800 shadow-2xl flex flex-col transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: Z_INDEX.SIDEBAR_RIGHT }}
      >
        {/* Header */}
        <div className="bg-dark-900 border-b border-dark-800 p-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 bg-primary-600/10 border border-primary-500/20 rounded-full flex items-center justify-center">
                <FaRobot size={16} className="text-primary-500" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-dark-900 animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-white text-sm">SecTube AI</h3>
                <div className="relative group">
                  <FaInfoCircle className="text-gray-500 hover:text-primary-500 cursor-help transition-colors" size={12} />
                  <div className="absolute left-0 top-full mt-2 w-56 bg-dark-800 border border-dark-700 rounded-md shadow-2xl p-3 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-[2002] pointer-events-none">
                    <p className="text-[11px] leading-relaxed text-gray-300">
                      <span className="text-primary-400 font-bold block mb-1">AI CAPABILITIES:</span>
                      • Natural language search<br/>
                      • Research summarization<br/>
                      • Technical Q&A<br/>
                      • Platform navigation
                    </p>
                    <div className="absolute top-0 left-3 -mt-1 w-2 h-2 bg-dark-800 border-t border-l border-dark-700 transform rotate-45"></div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="p-2 hover:bg-dark-800 rounded-md transition-colors text-gray-500 hover:text-red-500"
              title="Clear chat history"
            >
              <FaTrash size={14} />
            </button>
            <button
              onClick={toggleChatbot}
              className="p-2 hover:bg-dark-800 rounded-md transition-colors text-gray-400 hover:text-white"
              title="Close"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 pt-0.5">
                {message.role === 'user' ? (
                  user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt="You"
                      className="w-8 h-8 rounded-full border border-dark-700 object-cover"
                      onError={(e) => {
                        e.target.src = getAvatarUrl();
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-dark-800 rounded-full flex items-center justify-center border border-dark-700">
                      <FaUser size={14} className="text-gray-500" />
                    </div>
                  )
                ) : (
                  <div className="w-8 h-8 bg-primary-600/10 border border-primary-500/20 rounded-full flex items-center justify-center">
                    <FaRobot size={14} className="text-primary-500" />
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] px-4 py-2.5 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary-600/10 text-white rounded-md border border-primary-500/20'
                    : 'bg-dark-800 text-gray-200 rounded-md border border-dark-700'
                }`}
              >
                <div className={`prose prose-sm max-w-none ${
                  message.role === 'user'
                    ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-li:text-white prose-a:text-white'
                    : 'prose-headings:text-gray-100 prose-p:text-gray-200 prose-strong:text-primary-400 prose-a:text-primary-400 hover:prose-a:text-primary-300 prose-li:text-gray-200 prose-code:text-primary-400 prose-code:bg-dark-950 prose-code:px-1 prose-code:rounded'
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary-600/10 border border-primary-500/20 rounded-full flex items-center justify-center">
                <FaRobot size={14} className="text-primary-500" />
              </div>
              <div className="bg-dark-800 border border-dark-700 px-4 py-2.5 rounded-md">
                <div className="flex items-center gap-2">
                  <FaSpinner className="animate-spin text-primary-500" size={14} />
                  <span className="text-xs text-gray-400">SecTube AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-dark-900 border-t border-dark-800">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about security..."
              className="flex-1 bg-dark-800 border border-dark-700 rounded-md px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-800 disabled:cursor-not-allowed text-white px-4 rounded-md transition-all duration-300 border border-primary-500/30 disabled:border-dark-700 flex items-center justify-center group"
            >
              <FaPaperPlane size={14} className={`${input.trim() && !isLoading ? 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' : ''}`} />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-2 text-center uppercase tracking-tighter">
            SecTube AI can make mistakes. Verify critical security info.
          </p>
        </div>
      </div>

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
