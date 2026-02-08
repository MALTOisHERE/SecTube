import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { formatDistanceToNow } from 'date-fns';
import { FaThumbsUp, FaThumbsDown, FaShare } from 'react-icons/fa';
import { videoAPI } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import useAuthStore from '../store/authStore';

const Video = () => {
  const { videoId } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [showDescription, setShowDescription] = useState(false);

  const { data: videoData, isLoading } = useQuery(
    ['video', videoId],
    () => videoAPI.getVideo(videoId)
  );

  const { data: commentsData } = useQuery(
    ['comments', videoId],
    () => videoAPI.getComments(videoId)
  );

  const likeMutation = useMutation(() => videoAPI.likeVideo(videoId), {
    onSuccess: (response) => {
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
    (content) => videoAPI.addComment(videoId, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments', videoId]);
        setComment('');
      },
    }
  );

  if (isLoading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="aspect-video bg-dark-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  const video = videoData?.data?.data;

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
                      video.isLiked ? 'text-primary-600' : ''
                    }`}
                  >
                    <FaThumbsUp />
                    <span className="text-sm">{video.likeCount || 0}</span>
                  </button>
                  <div className="w-px h-6 bg-dark-700"></div>
                  <button
                    onClick={() => dislikeMutation.mutate()}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 px-4 py-2 hover:bg-dark-700 rounded-r-full disabled:opacity-50 transition ${
                      video.isDisliked ? 'text-primary-600' : ''
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
                <form onSubmit={(e) => { e.preventDefault(); commentMutation.mutate(comment); }} className="mb-6">
                  <div className="flex gap-3">
                    <img
                      src={`http://localhost:5000/avatars/${user?.avatar || 'default-avatar.svg'}`}
                      alt="Your avatar"
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'http://localhost:5000/avatars/default-avatar.svg';
                      }}
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full bg-transparent border-b border-dark-700 pb-2 focus:outline-none focus:border-white"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setComment('')}
                          className="px-4 py-2 text-sm hover:bg-dark-800 rounded-full"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!comment.trim() || commentMutation.isLoading}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-full text-sm disabled:opacity-50"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <p className="mb-6 text-sm text-gray-400">
                  <Link to="/login" className="text-primary-600 hover:text-primary-500">
                    Sign in
                  </Link>{' '}
                  to leave a comment
                </p>
              )}

              <div className="space-y-4">
                {commentsData?.data?.data?.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <img
                      src={`http://localhost:5000/avatars/${comment.user?.avatar || 'default-avatar.svg'}`}
                      alt={comment.user?.displayName}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'http://localhost:5000/avatars/default-avatar.svg';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.user?.displayName}</span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
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
