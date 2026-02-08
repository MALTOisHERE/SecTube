import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userAPI, channelAPI } from '../services/api';
import VideoCard from '../components/VideoCard';
import useAuthStore from '../store/authStore';
import { FaGithub, FaTwitter, FaLinkedin, FaGlobe, FaBug } from 'react-icons/fa';

const Channel = () => {
  const { username } = useParams();
  const { isAuthenticated, user } = useAuthStore();
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
    () => userAPI.subscribe(channelData?.data?.data?._id),
    {
      onSuccess: () => queryClient.invalidateQueries(['channel', username]),
    }
  );

  const unsubscribeMutation = useMutation(
    () => userAPI.unsubscribe(channelData?.data?.data?._id),
    {
      onSuccess: () => queryClient.invalidateQueries(['channel', username]),
    }
  );

  if (channelLoading) {
    return (
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-dark-800 rounded-xl p-8 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-dark-700 rounded-full"></div>
              <div className="flex-1 space-y-4">
                <div className="h-6 bg-dark-700 rounded w-1/4"></div>
                <div className="h-4 bg-dark-700 rounded w-1/3"></div>
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
  const isSubscribed = channel.subscribers?.some((sub) => sub._id === user?.id);

  const handleSubscribe = () => {
    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-dark-800 rounded-xl p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
            <img
              src={`http://localhost:5000/avatars/${channel.avatar || 'default-avatar.svg'}`}
              alt={channel.displayName}
              className="w-32 h-32 rounded-full"
              onError={(e) => {
                e.target.src = 'http://localhost:5000/avatars/default-avatar.svg';
              }}
            />

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-semibold mb-1">{channel.displayName}</h1>
              <p className="text-sm text-gray-400 mb-3">@{channel.username}</p>

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
                        className="bg-dark-700 px-3 py-1 rounded-full text-xs"
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
                      className="text-gray-400 hover:text-white transition"
                    >
                      <FaGithub size={20} />
                    </a>
                  )}
                  {channel.socialLinks.twitter && (
                    <a
                      href={channel.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition"
                    >
                      <FaTwitter size={20} />
                    </a>
                  )}
                  {channel.socialLinks.linkedin && (
                    <a
                      href={channel.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition"
                    >
                      <FaLinkedin size={20} />
                    </a>
                  )}
                  {channel.socialLinks.website && (
                    <a
                      href={channel.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition"
                    >
                      <FaGlobe size={20} />
                    </a>
                  )}
                  {channel.socialLinks.hackerone && (
                    <a
                      href={channel.socialLinks.hackerone}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition"
                    >
                      <FaBug size={20} />
                    </a>
                  )}
                </div>
              )}

              {!isOwnChannel && isAuthenticated && (
                <button
                  onClick={handleSubscribe}
                  disabled={subscribeMutation.isLoading || unsubscribeMutation.isLoading}
                  className={`px-6 py-2 rounded-full font-medium text-sm transition disabled:opacity-50 ${
                    isSubscribed
                      ? 'bg-dark-700 hover:bg-dark-600'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
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
