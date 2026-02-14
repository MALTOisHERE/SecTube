import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userAPI, channelAPI } from '../services/api';
import VideoCard from '../components/VideoCard';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { FaGithub, FaTwitter, FaLinkedin, FaGlobe, FaBug, FaBell, FaRegBell } from 'react-icons/fa';
import { getAvatarUrl } from '../config/constants';

const Channel = () => {
  const { username } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: channelData, isLoading: channelLoading } = useQuery(
    ['channel', username],
    () => channelAPI.getChannel(username)
  );

  const { data: videosData, isLoading: videosLoading } = useQuery(
    ['channel-videos', username, page],
    () => userAPI.getUserVideos(username, { page, limit: 12 })
  );

  const subscribeMutation = useMutation(
    () => isSubscribed
      ? userAPI.unsubscribe(channelData?.data?.data?._id)
      : userAPI.subscribe(channelData?.data?.data?._id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['channel', username]);
        addToast({
          type: isSubscribed ? 'info' : 'success',
          message: isSubscribed ? 'Unsubscribed successfully!' : 'Subscribed successfully!'
        });
      },
      onError: (error) => {
        addToast({
          type: 'error',
          message: error.response?.data?.message || 'Failed to update subscription'
        });
      }
    }
  );

  if (channelLoading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-dark-900 rounded-md border border-dark-800 p-6 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 bg-dark-800 rounded-full"></div>
              <div className="flex-1 space-y-4">
                <div className="h-5 bg-dark-800 rounded w-1/4"></div>
                <div className="h-4 bg-dark-800 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const channel = channelData?.data?.data;

  if (!channel) {
    return (
      <div className="px-6 py-6 text-center">
        <p className="text-xl text-gray-400">Channel not found</p>
      </div>
    );
  }

  const isOwnChannel = user?.username === channel.username;
  const isSubscribed = channel.subscribers?.some((sub) => {
    const subId = typeof sub === 'object' ? (sub._id || sub.id) : sub;
    const currentUserId = user?._id || user?.id;
    return String(subId) === String(currentUserId);
  }) || false;

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      addToast({
        type: 'warning',
        message: 'Please login to subscribe to this channel'
      });
      return;
    }
    subscribeMutation.mutate();
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-dark-900 rounded-md border border-dark-800 p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <img
              src={getAvatarUrl(channel.avatar)}
              alt={channel.displayName}
              className="w-28 h-28 rounded-full border border-dark-800"
              onError={(e) => {
                e.target.src = getAvatarUrl('default-avatar.svg');
              }}
            />

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-semibold mb-1">{channel.displayName}</h1>
              <p className="text-sm text-gray-500 mb-3">@{channel.username}</p>

              {channel.bio && <p className="text-sm text-gray-300 mb-4">{channel.bio}</p>}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4 text-sm text-gray-400">
                <span>
                  <strong className="text-white">{channel.subscriberCount || 0}</strong> subscribers
                </span>
                <span>•</span>
                <span>
                  <strong className="text-white">{channel.videoCount || 0}</strong> videos
                </span>
                <span>•</span>
                <span>
                  <strong className="text-white">{channel.totalViews || 0}</strong> total views
                </span>
              </div>

              {channel.specialties && channel.specialties.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {channel.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="bg-dark-800 px-2 py-0.5 rounded text-xs border border-dark-700"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {channel.socialLinks && (
                <div className="flex items-center gap-4 mb-4 justify-center md:justify-start">
                  {channel.socialLinks.github && (
                    <a
                      href={channel.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-300 transition"
                    >
                      <FaGithub size={18} />
                    </a>
                  )}
                  {channel.socialLinks.twitter && (
                    <a
                      href={channel.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition"
                    >
                      <FaTwitter size={18} />
                    </a>
                  )}
                  {channel.socialLinks.linkedin && (
                    <a
                      href={channel.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-300 transition"
                    >
                      <FaLinkedin size={18} />
                    </a>
                  )}
                  {channel.socialLinks.website && (
                    <a
                      href={channel.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-300 transition"
                    >
                      <FaGlobe size={18} />
                    </a>
                  )}
                  {channel.socialLinks.hackerone && (
                    <a
                      href={channel.socialLinks.hackerone}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-300 transition"
                    >
                      <FaBug size={18} />
                    </a>
                  )}
                </div>
              )}

              {!isOwnChannel && (
                <button
                  onClick={handleSubscribe}
                  disabled={!isAuthenticated || subscribeMutation.isLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition disabled:opacity-50 border ${
                    !isAuthenticated
                      ? 'bg-dark-800 text-gray-500 cursor-not-allowed border-dark-700'
                      : isSubscribed
                      ? 'bg-dark-800 hover:bg-dark-700 text-gray-300 border-dark-700'
                      : 'bg-primary-600 hover:bg-primary-700 text-white border-primary-700 shadow-sm'
                  }`}
                >
                  {isSubscribed ? <FaBell size={14} /> : <FaRegBell size={14} />}
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-medium mb-6">Videos</h2>

          {videosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-video bg-dark-800 rounded-xl mb-3"></div>
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-dark-800 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-dark-800 rounded w-3/4"></div>
                      <div className="h-3 bg-dark-800 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : videosData?.data?.data?.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">No videos yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                {videosData?.data?.data?.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>

              {videosData?.data?.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {page} of {videosData?.data?.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(videosData?.data?.pages, p + 1))}
                    disabled={page === videosData?.data?.pages}
                    className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Channel;
