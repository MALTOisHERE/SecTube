import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { FaBell, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { userAPI } from '../services/api';
import VideoCard from '../components/VideoCard';
import { getAvatarUrl } from '../config/constants';

const Subscriptions = () => {
  const [page, setPage] = useState(1);

  // Fetch subscribed channels
  const { data: channelsData, isLoading: isChannelsLoading } = useQuery(
    'subscribed-channels',
    () => userAPI.getSubscriptions()
  );

  // Fetch subscription feed (videos)
  const { data: feedData, isLoading: isFeedLoading } = useQuery(
    ['subscription-feed', page],
    () => userAPI.getSubscriptionFeed({ page, limit: 20 }),
    { keepPreviousData: true }
  );

  const channels = channelsData?.data?.data || [];
  const videos = feedData?.data?.data || [];
  const totalPages = feedData?.data?.pages || 1;

  // Loading state (only for initial load)
  if (isChannelsLoading && isFeedLoading && page === 1) {
    return (
      <div className="px-6 py-6 min-h-screen">
        <div className="h-8 w-48 bg-dark-900 animate-pulse rounded mb-8"></div>
        <div className="flex gap-6 mb-8 overflow-x-auto pb-4 scrollbar-hide">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-dark-900 animate-pulse border border-dark-800"></div>
              <div className="h-3 w-12 bg-dark-900 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
          {[...Array(10)].map((_, i) => (
            <div key={i}>
              <div className="aspect-video bg-dark-900 rounded-md mb-2 border border-dark-800 animate-pulse"></div>
              <div className="h-4 bg-dark-900 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-3 bg-dark-900 rounded w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Subscriptions</h1>
        <p className="text-sm text-gray-400">
          Latest videos from the channels you follow
        </p>
      </div>

      {/* Subscribed Channels List */}
      {channels.length > 0 && (
        <div className="mb-8 overflow-hidden">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {channels.map((channel) => (
              <Link
                key={channel._id}
                to={`/channel/${channel.username}`}
                className="flex-shrink-0 flex flex-col items-center group"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dark-800 group-hover:border-primary-500 transition-colors p-0.5 mb-2 overflow-hidden bg-dark-900">
                  <img
                    src={getAvatarUrl(channel.avatar)}
                    alt={channel.displayName}
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = getAvatarUrl();
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 group-hover:text-white transition-colors max-w-[80px] truncate text-center">
                  {channel.displayName || channel.username}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {videos.length === 0 && !isFeedLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <FaBell className="text-gray-700 mb-4" size={48} />
          <h2 className="text-lg font-medium text-white mb-1">No videos yet</h2>
          <p className="text-gray-500 max-w-xs mx-auto mb-6">
            Videos from channels you subscribe to will appear here.
          </p>
          <Link
            to="/browse"
            className="text-primary-500 hover:text-primary-400 font-medium transition"
          >
            Explore Channels
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
            {isFeedLoading && page > 1 && (
              [...Array(5)].map((_, i) => (
                <div key={`loading-${i}`}>
                  <div className="aspect-video bg-dark-900 rounded-md mb-2 border border-dark-800 animate-pulse"></div>
                  <div className="h-4 bg-dark-900 rounded w-3/4 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-dark-900 rounded w-1/2 animate-pulse"></div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12 mb-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-3 py-1.5 bg-dark-900 hover:bg-dark-800 border border-dark-700 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft size={12} />
                <span>Previous</span>
              </button>
              <span className="text-sm text-gray-400">
                Page <span className="text-white">{page}</span> of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-2 px-3 py-1.5 bg-dark-900 hover:bg-dark-800 border border-dark-700 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <FaChevronRight size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Subscriptions;
