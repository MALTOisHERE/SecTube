import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formatDistanceToNow } from 'date-fns';
import { FaThumbsUp, FaThumbsDown, FaShare, FaRegSmile, FaBell, FaRegBell, FaTwitter, FaLinkedin, FaFacebook, FaWhatsapp, FaTelegram, FaCopy, FaCheck, FaExclamationTriangle, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { videoAPI, userAPI } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import CommentItem from '../components/CommentItem';
import EmojiPicker from '../components/EmojiPicker';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { getAvatarUrl, getThumbnailUrl } from '../config/constants';
import { useDropdownPosition, getDropdownClasses } from '../hooks/useDropdownPosition';

const Video = () => {
  const { videoId } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const emojiButtonRef = useRef(null);
  const shareButtonRef = useRef(null);

  const { data: videoData, isLoading } = useQuery(
    ['video', videoId],
    () => videoAPI.getVideo(videoId),
    {
      refetchInterval: (data) => {
        // If video is still processing, poll every 3 seconds
        const status = data?.data?.data?.processingStatus;
        return status === 'processing' ? 3000 : false;
      }
    }
  );

  const video = videoData?.data?.data;
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Update local state when video data changes
  useEffect(() => {
    if (video) {
      setIsLiked(video.isLiked || false);
      setIsDisliked(video.isDisliked || false);
      // Check if current user is subscribed to the uploader
      if (user && video.uploader?.subscribers) {
        const currentUserId = user._id || user.id;
        setIsSubscribed(video.uploader.subscribers.some(sub => {
          const subId = typeof sub === 'object' ? (sub._id || sub.id) : sub;
          return String(subId) === String(currentUserId);
        }));
      } else {
        setIsSubscribed(false);
      }
    }
  }, [video, user]);

  // Check saved status
  useEffect(() => {
    const checkSaved = async () => {
      if (isAuthenticated && videoId) {
        try {
          const res = await userAPI.checkSavedStatus(videoId);
          setIsSaved(res.data.isSaved);
        } catch (error) {
          console.error('Error checking saved status:', error);
        }
      }
    };
    checkSaved();
  }, [isAuthenticated, videoId]);

  const { data: commentsData } = useQuery(
    ['comments', videoId],
    () => videoAPI.getComments(videoId)
  );

  // Fetch related videos (same category, excluding current video)
  const { data: relatedVideosData } = useQuery(
    ['relatedVideos', video?.category, videoId],
    () => videoAPI.getVideos({
      category: video?.category,
      limit: 10,
      sort: 'popular'
    }),
    {
      enabled: !!video?.category // Only fetch when we have the video category
    }
  );

  // Filter out current video from related videos
  const relatedVideos = (relatedVideosData?.data?.data || []).filter(v => v._id !== videoId);

  // Calculate dropdown positions
  const shareMenuPosition = useDropdownPosition(shareButtonRef, showShareMenu, 350);
  const emojiPickerPosition = useDropdownPosition(emojiButtonRef, showEmojiPicker, 300);

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

  const saveMutation = useMutation(() => userAPI.toggleSaveVideo(videoId), {
    onSuccess: (response) => {
      const { isSaved, message } = response.data;
      setIsSaved(isSaved);
      addToast({
        type: isSaved ? 'success' : 'info',
        message: message
      });
    },
    onError: () => {
      addToast({
        type: 'error',
        message: 'Failed to update saved status'
      });
    }
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

  const subscribeMutation = useMutation(
    () => isSubscribed
      ? userAPI.unsubscribe(video.uploader._id)
      : userAPI.subscribe(video.uploader._id),
    {
      onMutate: async () => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(['video', videoId]);

        // Optimistically update the UI
        const previousSubscribed = isSubscribed;
        const wasSubscribed = isSubscribed;
        setIsSubscribed(!isSubscribed);

        return { previousSubscribed, wasSubscribed };
      },
      onSuccess: (data, variables, context) => {
        // Refetch to get updated subscriber count
        queryClient.invalidateQueries(['video', videoId]);
        addToast({
          type: context.wasSubscribed ? 'info' : 'success',
          message: context.wasSubscribed ? 'Unsubscribed successfully' : 'Subscribed successfully'
        });
      },
      onError: (error, variables, context) => {
        // Revert on error
        if (context?.previousSubscribed !== undefined) {
          setIsSubscribed(context.previousSubscribed);
        }
        addToast({
          type: 'error',
          message: error.response?.data?.message || 'Failed to update subscription'
        });
      }
    }
  );

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      addToast({
        type: 'warning',
        message: 'Please login to subscribe to this channel'
      });
      return;
    }
    subscribeMutation.mutate();
  };

  const handleCopyLink = async () => {
    const videoUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(videoUrl);
      setLinkCopied(true);
      addToast({
        type: 'success',
        message: 'Link copied to clipboard!'
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      addToast({
        type: 'error',
        message: 'Failed to copy link'
      });
    }
  };

  const handleShare = (platform) => {
    const videoUrl = window.location.href;
    const videoTitle = video?.title || 'Check out this video';

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(videoTitle)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(videoTitle + ' ' + videoUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(videoTitle)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

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

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareButtonRef.current && !shareButtonRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main content skeleton */}
            <div className="lg:col-span-9">
              {/* Video player skeleton */}
              <div className="aspect-video bg-dark-800 rounded-md animate-pulse mb-4"></div>

              {/* Title skeleton */}
              <div className="h-7 bg-dark-800 rounded animate-pulse mb-3 w-3/4"></div>

              {/* Channel info and actions skeleton */}
              <div className="flex items-center justify-between mb-4 gap-4">
                <div className="flex items-center justify-between flex-1">
                  {/* Channel info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-dark-800 rounded-full animate-pulse"></div>
                    <div>
                      <div className="h-6 bg-dark-800 rounded animate-pulse w-32 mb-1"></div>
                      <div className="h-4 bg-dark-800 rounded animate-pulse w-24"></div>
                    </div>
                  </div>
                  {/* Subscribe button skeleton */}
                  <div className="h-8 bg-dark-800 rounded-md animate-pulse w-28"></div>
                </div>
                {/* Separator */}
                <div className="h-8 w-px bg-dark-700"></div>
                {/* Action buttons skeleton */}
                <div className="flex items-center gap-2">
                  <div className="h-8 bg-dark-800 rounded-md animate-pulse w-24"></div>
                  <div className="h-8 bg-dark-800 rounded-md animate-pulse w-20"></div>
                </div>
              </div>

              {/* Description skeleton */}
              <div className="bg-dark-900 border border-dark-800 rounded-md p-4 mb-4">
                <div className="h-5 bg-dark-800 rounded mb-2 w-full animate-pulse"></div>
                <div className="h-5 bg-dark-800 rounded mb-2 w-5/6 animate-pulse"></div>
                <div className="h-5 bg-dark-800 rounded w-4/6 animate-pulse"></div>
              </div>

              {/* Comments section */}
              <div>
                {/* Comments title skeleton */}
                <div className="h-7 bg-dark-800 rounded animate-pulse w-32 mb-4"></div>

                {/* Comment form skeleton (when authenticated) */}
                <div className="mb-8">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-dark-800 rounded-full animate-pulse flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-20 bg-dark-800 rounded-md animate-pulse mb-3"></div>
                      <div className="flex justify-end gap-2">
                        <div className="h-8 bg-dark-800 rounded-md animate-pulse w-20"></div>
                        <div className="h-8 bg-dark-800 rounded-md animate-pulse w-24"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="h-px bg-gray-800 mb-6"></div>

                {/* Comments list skeleton */}
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-2.5 py-2">
                      <div className="w-8 h-8 bg-dark-800 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-dark-800 rounded animate-pulse w-40 mb-1"></div>
                        <div className="h-4 bg-dark-800 rounded animate-pulse w-full mb-1"></div>
                        <div className="h-4 bg-dark-800 rounded animate-pulse w-3/4 mb-2"></div>
                        <div className="h-3 bg-dark-800 rounded animate-pulse w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Related videos sidebar skeleton */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="h-7 bg-dark-800 rounded animate-pulse w-32 mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-2 p-2">
                    <div className="relative flex-shrink-0 w-56">
                      <div className="w-full aspect-video bg-dark-800 rounded-lg animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-5 bg-dark-800 rounded animate-pulse w-full mb-1"></div>
                      <div className="h-5 bg-dark-800 rounded animate-pulse w-3/4 mb-1"></div>
                      <div className="h-4 bg-dark-800 rounded animate-pulse w-2/3 mb-1"></div>
                      <div className="h-4 bg-dark-800 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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

  // Show processing state
  if (video.processingStatus === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 min-h-[70vh]">
        <div className="w-12 h-12 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-lg font-medium text-white mb-1">Processing Your Content</h2>
        <p className="text-gray-500 max-w-xs mx-auto">
          We're currently transcoding your video for multiple qualities. This page will update automatically.
        </p>
      </div>
    );
  }

  // Show failed state
  if (video.processingStatus === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 min-h-[70vh]">
        <FaExclamationTriangle className="text-gray-700 mb-4" size={48} />
        <h2 className="text-lg font-medium text-white mb-1">Processing Failed</h2>
        <p className="text-gray-500 max-w-xs mx-auto mb-6">
          There was an error processing your video. Please try uploading again.
        </p>
        <Link
          to="/settings#upload"
          className="text-primary-500 hover:text-primary-400 font-medium transition"
        >
          Upload Another Video
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main content */}
          <div className="lg:col-span-9">
            {/* Video player */}
            <div className="mb-4">
              <VideoPlayer video={video} />
            </div>

            {/* Video title */}
            <h1 className="text-xl font-semibold mb-3">{video.title}</h1>

            {/* Video info */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="flex items-center justify-between flex-1">
                <Link to={`/channel/${video.uploader?.username}`} className="flex items-center gap-3">
                  <img
                    src={getAvatarUrl(video.uploader?.avatar)}
                    alt={video.uploader?.displayName || video.uploader?.username}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      e.target.src = getAvatarUrl();
                    }}
                  />
                  <div>
                    <div className="font-medium">{video.uploader?.displayName || video.uploader?.username}</div>
                    <div className="text-xs text-gray-400">
                      {video.uploader?.subscribers?.length || 0} subscribers
                    </div>
                  </div>
                </Link>

                {/* Subscribe button - show for all non-owners, grayed if not authenticated */}
                {user?._id !== video.uploader?._id && (
                  <button
                    onClick={handleSubscribeClick}
                    disabled={!isAuthenticated || subscribeMutation.isLoading}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition disabled:opacity-50 text-sm font-medium border ${
                      !isAuthenticated
                        ? 'bg-dark-800 text-gray-500 cursor-not-allowed border-dark-700'
                        : isSubscribed
                        ? 'bg-dark-800 hover:bg-dark-700 text-gray-300 border-dark-700'
                        : 'bg-primary-600 hover:bg-primary-700 text-white border-primary-700 shadow-sm'
                    }`}
                  >
                    {isSubscribed ? <FaBell /> : <FaRegBell />}
                    <span className="text-sm font-medium">
                      {isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </span>
                  </button>
                )}
              </div>

              {/* Separator - only show when subscribe button is visible */}
              {user?._id !== video.uploader?._id && (
                <div className="h-8 w-px bg-dark-700"></div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-dark-900 rounded-md border border-dark-700">
                  <button
                    onClick={() => likeMutation.mutate()}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 px-3 py-1.5 hover:bg-dark-800 rounded-l-md disabled:opacity-50 transition text-sm font-medium ${
                      isLiked ? 'text-primary-500' : 'text-gray-400'
                    }`}
                  >
                    <FaThumbsUp size={14} />
                    <span>{video?.likeCount || 0}</span>
                  </button>
                  <div className="w-px h-5 bg-dark-700"></div>
                  <button
                    onClick={() => dislikeMutation.mutate()}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 px-3 py-1.5 hover:bg-dark-800 rounded-r-md disabled:opacity-50 transition text-sm ${
                      isDisliked ? 'text-primary-500' : 'text-gray-400'
                    }`}
                  >
                    <FaThumbsDown size={14} />
                  </button>
                </div>

                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition border font-medium text-sm ${
                    isSaved
                      ? 'bg-dark-800 text-primary-500 border-primary-900/50'
                      : 'bg-dark-900 hover:bg-dark-800 text-gray-400 border-dark-700'
                  }`}
                >
                  {isSaved ? <FaBookmark size={14} /> : <FaRegBookmark size={14} />}
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>

                <div className="relative" ref={shareButtonRef}>
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 bg-dark-900 hover:bg-dark-800 px-3 py-1.5 rounded-md transition border border-dark-700 text-sm font-medium text-gray-400"
                  >
                    <FaShare size={14} />
                    <span>Share</span>
                  </button>

                  {/* Share dropdown menu */}
                  {showShareMenu && (
                    <div className={`absolute right-0 ${getDropdownClasses(shareMenuPosition)} w-56 bg-dark-900 rounded-md shadow-xl border border-dark-700 py-2 z-50`}>
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition text-left"
                      >
                        {linkCopied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                        <span className="text-sm">{linkCopied ? 'Link copied!' : 'Copy link'}</span>
                      </button>
                      <div className="h-px bg-dark-700 my-1"></div>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition text-left"
                      >
                        <FaTwitter className="text-[#1DA1F2]" />
                        <span className="text-sm">Share on Twitter</span>
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition text-left"
                      >
                        <FaFacebook className="text-[#1877F2]" />
                        <span className="text-sm">Share on Facebook</span>
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition text-left"
                      >
                        <FaLinkedin className="text-[#0A66C2]" />
                        <span className="text-sm">Share on LinkedIn</span>
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition text-left"
                      >
                        <FaWhatsapp className="text-[#25D366]" />
                        <span className="text-sm">Share on WhatsApp</span>
                      </button>
                      <button
                        onClick={() => handleShare('telegram')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-dark-700 transition text-left"
                      >
                        <FaTelegram className="text-[#0088cc]" />
                        <span className="text-sm">Share on Telegram</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-dark-900 rounded-md border border-dark-800 p-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <span>{video.views} views</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })}</span>
                <span>•</span>
                <span className="bg-dark-800 px-2 py-0.5 rounded text-xs border border-dark-700">{video.category}</span>
                <span className="bg-dark-800 px-2 py-0.5 rounded text-xs border border-dark-700">{video.difficulty}</span>
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
                      <span key={tool} className="bg-dark-800 px-2 py-0.5 rounded text-xs border border-dark-700">
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
                      src={getAvatarUrl(user?.avatar)}
                      alt="Your avatar"
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                      onError={(e) => {
                        e.target.src = getAvatarUrl();
                      }}
                    />
                    <div className="flex-1 relative">
                      <div className="relative">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="w-full bg-dark-900 border border-dark-700 rounded-md px-3 py-2 pr-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
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
                        <div className={`absolute z-50 ${getDropdownClasses(emojiPickerPosition)} right-0`}>
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
                          className="px-3 py-1.5 text-sm bg-dark-800 hover:bg-dark-700 rounded-md transition border border-dark-700 font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!comment.trim() || commentMutation.isLoading}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed border border-primary-700 shadow-sm"
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

              {/* Separator */}
              <div className="h-px bg-gray-800 mb-6"></div>

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
          <div className="hidden lg:block lg:col-span-3">
            <h3 className="text-lg font-semibold mb-4">Related videos</h3>
            {relatedVideos.length > 0 ? (
              <div className="space-y-4">
                {relatedVideos.slice(0, 8).map((relatedVideo) => (
                  <Link
                    key={relatedVideo._id}
                    to={`/video/${relatedVideo._id}`}
                    className="flex gap-2 hover:bg-dark-800 p-2 rounded-lg transition"
                  >
                    <div className="relative flex-shrink-0 w-56">
                      <img
                        src={getThumbnailUrl(relatedVideo.thumbnail)}
                        alt={relatedVideo.title}
                        className="w-full aspect-video object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = getThumbnailUrl();
                        }}
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 px-1 py-0.5 rounded text-xs">
                        {Math.floor(relatedVideo.duration / 60)}:{(relatedVideo.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-medium line-clamp-2 mb-1">{relatedVideo.title}</h4>
                      <p className="text-sm text-gray-400 mb-1">{relatedVideo.uploader?.displayName}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <span>{relatedVideo.views >= 1000 ? `${(relatedVideo.views / 1000).toFixed(1)}K` : relatedVideo.views} views</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(relatedVideo.uploadedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-base text-gray-500">No related videos found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Video;
