import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FaHistory, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { userAPI } from '../services/api';
import VideoCard from '../components/VideoCard';
import ConfirmDialog from '../components/ConfirmDialog';

const History = () => {
  const [page, setPage] = useState(1);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch watch history
  const { data, isLoading, isError } = useQuery(
    ['watch-history', page],
    () => userAPI.getWatchHistory({ page, limit: 20 }),
    { keepPreviousData: true }
  );

  // Clear history mutation
  const clearMutation = useMutation(
    () => userAPI.clearWatchHistory(),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('watch-history');
      }
    }
  );

  const videos = data?.data?.data || [];
  const totalPages = data?.data?.pages || 1;

  const handleClearHistory = () => {
    setIsConfirmOpen(true);
  };

  const confirmClear = () => {
    clearMutation.mutate();
  };

  if (isLoading && page === 1) {
    return (
      <div className="px-6 py-6 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-48 bg-dark-900 animate-pulse rounded"></div>
          <div className="h-10 w-32 bg-dark-900 animate-pulse rounded"></div>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-2">Watch History</h1>
          <p className="text-sm text-gray-400">
            Videos you've watched recently
          </p>
        </div>
        
        {videos.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 bg-dark-900 hover:bg-red-900/20 border border-dark-800 hover:border-red-900/50 rounded-md text-sm font-medium text-gray-300 hover:text-red-400 transition"
          >
            <FaTrash size={14} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {videos.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <FaHistory className="text-gray-700 mb-4" size={48} />
          <h2 className="text-lg font-medium text-white mb-1">Your history is empty</h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            Videos you watch will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {videos.map((video, index) => (
              <VideoCard key={`${video._id}-${index}`} video={video} />
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

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmClear}
        title="Clear Watch History?"
        message="This will remove all videos from your watch history. This action cannot be undone."
        confirmText="Clear History"
      />
    </div>
  );
};

export default History;
