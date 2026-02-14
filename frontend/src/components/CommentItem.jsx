import { useState, useRef, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaReply, FaRegSmile } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { videoAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import EmojiPicker from './EmojiPicker';
import { getAvatarUrl } from '../config/constants';
import { useDropdownPosition, getDropdownClasses } from '../hooks/useDropdownPosition';

const CommentItem = ({ comment, videoUploaderId, onReplySubmit, level = 0 }) => {
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [submittingReply, setSubmittingReply] = useState(false);
  const emojiButtonRef = useRef(null);

  // Calculate emoji picker position
  const emojiPickerPosition = useDropdownPosition(emojiButtonRef, showEmojiPicker, 300);

  const isAuthor = comment.user._id === videoUploaderId;

  // Sync state when comment prop updates (on page refresh)
  useEffect(() => {
    setIsLiked(comment.isLiked || false);
    setLikeCount(comment.likeCount || 0);
  }, [comment.isLiked, comment.likeCount]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      addToast({ type: 'warning', message: 'Please login to like comments' });
      return;
    }

    try {
      const response = await videoAPI.likeComment(comment._id);
      setIsLiked(response.data.data.isLiked);
      setLikeCount(response.data.data.likes);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to like comment' });
    }
  };

  const loadReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    setLoadingReplies(true);
    try {
      const response = await videoAPI.getCommentReplies(comment._id);
      setReplies(response.data.data);
      setShowReplies(true);
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to load replies' });
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    if (!isAuthenticated) {
      addToast({ type: 'warning', message: 'Please login to reply' });
      return;
    }

    setSubmittingReply(true);
    try {
      await onReplySubmit(replyContent, comment._id);
      setReplyContent('');
      setShowReplyBox(false);
      setShowEmojiPicker(false);
      addToast({ type: 'success', message: 'Reply posted successfully' });
      // Reload replies
      if (showReplies) {
        const response = await videoAPI.getCommentReplies(comment._id);
        setReplies(response.data.data);
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to post reply' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const onEmojiSelect = (emoji) => {
    setReplyContent((prev) => prev + emoji);
  };

  return (
    <div className={`${level > 0 ? 'ml-12' : ''}`}>
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <img
          src={getAvatarUrl(comment.user.avatar)}
          alt={comment.user.displayName}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            e.target.src = getAvatarUrl('default-avatar.svg');
          }}
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-white text-sm">
              {comment.user.displayName || comment.user.username}
            </span>
            {isAuthor && (
              <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Author
              </span>
            )}
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Content */}
          <p className="text-gray-200 text-sm mb-2 break-words whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              {isLiked ? <FaHeart className="text-base" /> : <FaRegHeart className="text-base" />}
              <span className="min-w-[20px] text-left">{likeCount > 0 ? likeCount : ''}</span>
            </button>

            {level === 0 && (
              <button
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition"
              >
                <FaReply className="text-sm" />
                <span>Reply</span>
              </button>
            )}

            {comment.replyCount > 0 && level === 0 && (
              <button
                onClick={loadReplies}
                className="text-sm font-medium text-primary-500 hover:text-primary-400 transition"
              >
                {loadingReplies
                  ? 'Loading...'
                  : showReplies
                  ? 'Hide replies'
                  : `${comment.replyCount} ${comment.replyCount === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>

          {/* Reply Box */}
          {showReplyBox && (
            <form onSubmit={handleReplySubmit} className="mt-4">
              <div className="relative">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-600 resize-none"
                  rows={3}
                  maxLength={1000}
                />
                <button
                  ref={emojiButtonRef}
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-primary-500 transition-colors"
                  title="Add emoji"
                >
                  <FaRegSmile className="text-lg" />
                </button>

                {showEmojiPicker && (
                  <div className={`absolute z-50 ${getDropdownClasses(emojiPickerPosition)} right-0`}>
                    <EmojiPicker
                      onEmojiSelect={onEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  type="submit"
                  disabled={!replyContent.trim() || submittingReply}
                  className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReply ? 'Posting...' : 'Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyContent('');
                    setShowEmojiPicker(false);
                  }}
                  className="bg-dark-700 hover:bg-dark-600 px-4 py-2 rounded-lg text-sm transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="border-l-2 border-dark-700 ml-5 mt-1">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              videoUploaderId={videoUploaderId}
              onReplySubmit={onReplySubmit}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
