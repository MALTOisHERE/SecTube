import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { FaFilter, FaSortAmountDown, FaFire, FaClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
    <div className="px-6 py-6 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Browse Videos</h1>
        <p className="text-sm text-gray-400">
          Explore cybersecurity content from the community
        </p>
      </div>

        {/* Filters */}
        <div className="bg-dark-900 border border-dark-800 rounded-md p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                <FaFilter size={12} />
                <span>Category</span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-dark-800 border border-dark-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                <FaFilter size={12} />
                <span>Difficulty</span>
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-dark-800 border border-dark-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex-1 min-w-[150px]">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                <FaSortAmountDown size={12} />
                <span>Sort By</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-dark-800 border border-dark-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          {data?.data?.total > 0 && (
            <div className="mt-4 pt-4 border-t border-dark-800">
              <p className="text-sm text-gray-400">
                <span className="font-medium text-white">{data.data.total}</span> videos found
              </p>
            </div>
          )}
        </div>

        {/* Videos Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {[...Array(15)].map((_, i) => (
              <div key={i}>
                <div className="aspect-video bg-dark-800 rounded-md border border-dark-800 mb-2 animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-dark-800 rounded-full border border-dark-800 flex-shrink-0 animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-dark-800 rounded animate-pulse w-full mb-0.5"></div>
                    <div className="h-4 bg-dark-800 rounded animate-pulse w-3/4 mb-0.5"></div>
                    <div className="h-3 bg-dark-800 rounded animate-pulse w-2/3 mb-0.5"></div>
                    <div className="h-3 bg-dark-800 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : data?.data?.data?.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-md py-16 text-center">
            <p className="text-lg text-gray-400 mb-2">No videos found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
              {data?.data?.data?.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>

            {/* Pagination */}
            {data?.data?.pages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-3 py-1.5 bg-dark-900 hover:bg-dark-800 border border-dark-700 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-dark-900"
                >
                  <FaChevronLeft size={12} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Page numbers */}
                  {[...Array(Math.min(5, data?.data?.pages))].map((_, idx) => {
                    let pageNum;
                    if (data?.data?.pages <= 5) {
                      pageNum = idx + 1;
                    } else if (page <= 3) {
                      pageNum = idx + 1;
                    } else if (page >= data?.data?.pages - 2) {
                      pageNum = data?.data?.pages - 4 + idx;
                    } else {
                      pageNum = page - 2 + idx;
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition border ${
                          page === pageNum
                            ? 'bg-primary-600 border-primary-700 text-white'
                            : 'bg-dark-900 border-dark-700 text-gray-400 hover:bg-dark-800 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage((p) => Math.min(data?.data?.pages, p + 1))}
                  disabled={page === data?.data?.pages}
                  className="flex items-center gap-2 px-3 py-1.5 bg-dark-900 hover:bg-dark-800 border border-dark-700 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-dark-900"
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

export default Browse;
