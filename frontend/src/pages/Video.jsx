import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formatDistanceToNow } from 'date-fns';
import { FaThumbsUp, FaThumbsDown, FaShare, FaRegSmile } from 'react-icons/fa';
import { videoAPI } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import CommentItem from '../components/CommentItem';
import EmojiPicker from '../components/EmojiPicker';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';

const Video = () => {
  const { videoId } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef(null);

  const { data: videoData, isLoading } = useQuery(
    ['video', videoId],
    () => videoAPI.getVideo(videoId)
  );

  const video = videoData?.data?.data;
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  // Update local state when video data changes
  useEffect(() => {
    if (video) {
      setIsLiked(video.isLiked || false);
      setIsDisliked(video.isDisliked || false);
    }
  }, [video?.isLiked, video?.isDisliked]);

  const { data: commentsData } = useQuery(
    ['comments', videoId],
    () => videoAPI.getComments(videoId)
  );

  const likeMutation = useMutation(() => videoAPI.likeVideo(videoId), {
    onSuccess: (response) => {
      setIsLiked(response.data.data.isLiked);
      setIsDisliked(response.data.data.isDisliked);
      // Update cache without refetching to avoid incrementing views
      queryClient.setQueryData(['video', videoId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: {
              ...oldData.data.data,
              likeCount: response.data.data.likes,
              dislikeCount: response.data.data.dislikes,
              isLiked: response.data.data.isLiked,
              isDisliked: response.data.data.isDisliked
            }
          }
        };
      });
    },
  });

  const dislikeMutation = useMutation(() => videoAPI.dislikeVideo(videoId), {
    onSuccess: (response) => {
      setIsLiked(response.data.data.isLiked);
      setIsDisliked(response.data.data.isDisliked);
      // Update cache without refetching to avoid incrementing views
      queryClient.setQueryData(['video', videoId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: {
              ...oldData.data.data,
              likeCount: response.data.data.likes,
              dislikeCount: response.data.data.dislikes,
              isLiked: response.data.data.isLiked,
              isDisliked: response.data.data.isDisliked
            }
          }
        };
      });
    },
  });

  const commentMutation = useMutation(
    (data) => videoAPI.addComment(videoId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', videoId]);
        setComment('');
        setShowEmojiPicker(false);
        addToast({ type: 'success', message: 'Comment posted successfully' });
      },
      onError: () => {
        addToast({ type: 'error', message: 'Failed to post comment' });
      }
    }
  );

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    commentMutation.mutate({ content: comment });
  };

  const handleReplySubmit = async (content, parentCommentId) => {
    await videoAPI.addComment(videoId, { content, parentComment: parentCommentId });
    queryClient.invalidateQueries(['comments', videoId]);
  };

  const onEmojiSelect = (emoji) => {
    setComment((prev) => prev + emoji);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="aspect-video bg-dark-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="px-6 py-6 text-center">
        <p className="text-xl text-gray-400">Video not found</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Video player */}
            <div className="mb-4">
              <VideoPlayer video={video} />
            </div>

            {/* Video title */}
            <h1 className="text-xl font-semibold mb-3">{video.title}</h1>

            {/* Video info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Link to={`/channel/${video.uploader?.username}`} className="flex items-center gap-3">
                  <img
                    src={`http://localhost:5000/avatars/${video.uploader?.avatar || 'default-avatar.svg'}`}
                    alt={video.uploader?.displayName}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.target.src = 'http://localhost:5000/avatars/default-avatar.svg';
                    }}
                  />
                  <div>
                    <div className="font-medium">{video.uploader?.displayName}</div>
                    <div className="text-xs text-gray-400">
                      {video.uploader?.subscribers?.length || 0} subscribers
                    </div>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-dark-800 rounded-full">
                  <button
                    onClick={() => likeMutation.mutate()}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 px-4 py-2 hover:bg-dark-700 rounded-l-full disabled:opacity-50 transition ${
                      isLiked ? 'text-primary-500' : 'text-gray-300'
                    }`}
                  >
                    <FaThumbsUp />
                    <span className="text-sm">{video?.likeCount || 0}</span>
                  </button>
                  <div className="w-px h-6 bg-dark-700"></div>
                  <button
                    onClick={() => dislikeMutation.mutate()}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 px-4 py-2 hover:bg-dark-700 rounded-r-full disabled:opacity-50 transition ${
                      isDisliked ? 'text-primary-500' : 'text-gray-300'
                    }`}
                  >
                    <FaThumbsDown />
                  </button>
                </div>

                <button className="flex items-center gap-2 bg-dark-800 hover:bg-dark-700 px-4 py-2 rounded-full">
                  <FaShare />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-dark-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <span>{video.views} views</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })}</span>
                <span>•</span>
                <span className="bg-dark-700 px-2 py-0.5 rounded">{video.category}</span>
                <span className="bg-dark-700 px-2 py-0.5 rounded">{video.difficulty}</span>
              </div>

              <div className={`text-sm ${!showDescription && 'line-clamp-2'}`}>
                {video.description}
              </div>

              {video.description.length > 100 && (
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="text-sm text-gray-400 hover:text-white mt-2"
                >
                  {showDescription ? 'Show less' : 'Show more'}
                </button>
              )}

              {video.toolsUsed && video.toolsUsed.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dark-700">
                  <div className="text-sm font-medium mb-2">Tools used:</div>
                  <div className="flex flex-wrap gap-2">
                    {video.toolsUsed.map((tool) => (
                      <span key={tool} className="bg-dark-700 px-2 py-1 rounded text-xs">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h2 className="text-lg font-medium mb-4">
                {commentsData?.data?.total || 0} Comments
              </h2>

              {isAuthenticated ? (
                <form onSubmit={handleCommentSubmit} className="mb-8">
                  <div className="flex gap-3">
                    <img
                      src={`http://localhost:5000/avatars/${user?.avatar || 'default-avatar.svg'}`}
                      alt="Your avatar"
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                      onError={(e) => {
                        e.target.src = 'http://localhost:5000/avatars/default-avatar.svg';
                      }}
                    />
                    <div className="flex-1 relative">
                      <div className="relative">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment..."
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
                      </div>

                      {showEmojiPicker && (
                        <div className="absolute z-50 mt-2 right-0">
                          <EmojiPicker
                            onEmojiSelect={onEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setComment('');
                            setShowEmojiPicker(false);
                          }}
                          className="px-4 py-2 text-sm bg-dark-700 hover:bg-dark-600 rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!comment.trim() || commentMutation.isLoading}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {commentMutation.isLoading ? 'Posting...' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="mb-8 text-sm text-gray-400">
                  <Link to="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                    Sign in
                  </Link>{' '}
                  to leave a comment
                </p>
              )}

              <div className="space-y-1">
                {commentsData?.data?.data?.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    videoUploaderId={videoData?.data?.data?.uploader?._id}
                    onReplySubmit={handleReplySubmit}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - Related videos */}
          <div className="hidden lg:block">
            <h3 className="text-sm font-medium mb-4">Related videos</h3>
            {/* Add related videos here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;
