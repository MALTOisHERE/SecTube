import { useState, useRef, useEffect } from 'react';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  'Objects': ['💻', '📱', '⌨️', '🖥️', '🖱️', '🔒', '🔑', '🔐', '🛡️', '⚔️', '🔧', '🔨', '⚡', '🔥', '💡', '🎯', '🏆', '🎉', '🎊', '✨'],
  'Symbols': ['✅', '❌', '⭐', '🌟', '💫', '🔴', '🟢', '🔵', '⚪', '⚫', '🟣', '🟡', '🟠', '💯', '🔞', '⚠️', '🚫', '📍', '💬', '👁️']
};

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys');
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (e, emoji) => {
    e.preventDefault();
    e.stopPropagation();
    onEmojiSelect(emoji);
  };

  return (
    <div
      ref={pickerRef}
      className="relative bg-dark-900 border border-dark-700 rounded-md shadow-xl p-2.5 w-72"
    >
      {/* Arrow pointer */}
      <div className="absolute -top-1.5 right-6 w-3 h-3 bg-dark-900 border-l border-t border-dark-700 transform rotate-45"></div>

      {/* Header with close button */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-dark-800 relative z-10">
        <span className="text-xs font-medium text-gray-400">Pick an emoji</span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-hide">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition border ${
              activeCategory === category
                ? 'bg-primary-600 text-white border-primary-700'
                : 'bg-dark-800 text-gray-400 hover:bg-dark-700 border-dark-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-0.5 max-h-44 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => handleEmojiClick(e, emoji)}
            className="text-xl p-1.5 hover:bg-dark-800 rounded transition aspect-square flex items-center justify-center"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
