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
      className="relative bg-dark-800 border border-dark-700 rounded-lg shadow-2xl p-3 w-80"
    >
      {/* Arrow pointer */}
      <div className="absolute -top-2 right-6 w-4 h-4 bg-dark-800 border-l border-t border-dark-700 transform rotate-45"></div>

      {/* Header with close button */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-dark-700 relative z-10">
        <span className="text-sm font-medium text-gray-300">Pick an emoji</span>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white transition text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto scrollbar-hide">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition ${
              activeCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-dark-800">
        {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => handleEmojiClick(e, emoji)}
            className="text-2xl p-2 hover:bg-dark-700 rounded transition aspect-square flex items-center justify-center"
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
