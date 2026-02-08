import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { videoAPI } from '../services/api';
import VideoCard from '../components/VideoCard';

const categories = [
  'All',
  'Web Application Security',
  'Network Security',
  'Bug Bounty',
  'Penetration Testing',
  'Malware Analysis',
  'Reverse Engineering',
  'Mobile Security',
  'Cloud Security',
  'CTF Writeup',
  'OSINT',
  'Cryptography',
  'IoT Security',
  'Security Tools',
  'Tutorial',
];

const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    limit: 24,
    ...(selectedCategory !== 'All' && { category: selectedCategory }),
    ...(selectedDifficulty !== 'All' && { difficulty: selectedDifficulty }),
    sort: sortBy === 'popular' ? 'popular' : sortBy === 'oldest' ? 'oldest' : '-uploadedAt',
  };

  const { data, isLoading } = useQuery(
    ['browse-videos', queryParams],
    () => videoAPI.getVideos(queryParams)
  );

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
    if (category !== 'All') {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="px-6 py-6">
      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-600"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPage(1);
            }}
            className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-600"
          >
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="bg-dark-800 border border-dark-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-600"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        {data?.data?.total > 0 && (
          <p className="text-sm text-gray-400">
            {data.data.total} videos found
          </p>
        )}
      </div>

      {/* Videos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {[...Array(12)].map((_, i) => (
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
      ) : data?.data?.data?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">No videos found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {data?.data?.data?.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>

          {/* Pagination */}
          {data?.data?.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {data?.data?.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data?.data?.pages, p + 1))}
                disabled={page === data?.data?.pages}
                className="px-4 py-2 bg-dark-800 hover:bg-dark-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Browse;
