import { useState } from 'react';
import { useQuery } from 'react-query';
import { FaBookmark, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { userAPI } from '../services/api';
import VideoCard from '../components/VideoCard';
import { Link } from 'react-router-dom';

const Saved = () => {
  const [page, setPage] = useState(1);

  // Fetch saved videos
  const { data, isLoading } = useQuery(
    ['saved-videos', page],
    () => userAPI.getSavedVideos({ page, limit: 20 }),
    { keepPreviousData: true }
  );

  const videos = data?.data?.data || [];
  const totalPages = data?.data?.pages || 1;

  if (isLoading && page === 1) {
    return (
      <div className="px-6 py-6 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-48 bg-dark-900 animate-pulse rounded"></div>
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
        <h1 className="text-2xl font-semibold text-white mb-2">Saved Videos</h1>
        <p className="text-sm text-gray-400">
          Your collection of bookmarked videos
        </p>
      </div>

      {videos.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <FaBookmark className="text-gray-700 mb-4" size={48} />
          <h2 className="text-lg font-medium text-white mb-1">No saved videos</h2>
          <p className="text-gray-500 max-w-xs mx-auto mb-6">
            Videos you save will appear here.
          </p>
          <Link
            to="/browse"
            className="text-primary-500 hover:text-primary-400 font-medium transition"
          >
            Explore Content
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
            {isLoading && page > 1 && (
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

export default Saved;
