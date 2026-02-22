import { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { FaFilter, FaSortAmountDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { videoAPI } from '../services/api';
import VideoCard from '../components/VideoCard';
import CustomSelect from '../components/CustomSelect';

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

const sortOptions = [
  { label: 'Latest', value: 'latest' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Oldest', value: 'oldest' },
];

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
    () => videoAPI.getVideos(queryParams),
    { keepPreviousData: true }
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
        <h1 className="text-2xl font-bold text-white mb-2">Browse Videos</h1>
        <p className="text-sm text-gray-400">
          Explore cybersecurity content from the community
        </p>
      </div>

      {/* Filters */}
      <div className="bg-dark-900 border border-dark-800 rounded-lg p-6 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <CustomSelect
            label="Category"
            icon={FaFilter}
            options={categories}
            value={selectedCategory}
            onChange={handleCategoryChange}
          />

          <CustomSelect
            label="Difficulty"
            icon={FaFilter}
            options={difficulties}
            value={selectedDifficulty}
            onChange={(val) => {
              setSelectedDifficulty(val);
              setPage(1);
            }}
          />

          <CustomSelect
            label="Sort By"
            icon={FaSortAmountDown}
            options={sortOptions}
            value={sortBy}
            onChange={(val) => {
              setSortBy(val);
              setPage(1);
            }}
          />
        </div>

        {/* Results Count */}
        {data?.data?.total > 0 && (
          <div className="mt-6 pt-6 border-t border-dark-800">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              <span className="text-primary-500">{data.data.total}</span> videos found
            </p>
          </div>
        )}
      </div>

      {/* Videos Grid */}
      {isLoading && page === 1 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
          {[...Array(15)].map((_, i) => (
            <div key={i}>
              <div className="aspect-video bg-dark-800 rounded-md border border-dark-800 mb-2 animate-pulse"></div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-dark-800 rounded-full border border-dark-800 flex-shrink-0 animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-dark-800 rounded animate-pulse w-full mb-0.5"></div>
                  <div className="h-4 bg-dark-800 rounded animate-pulse w-3/4 mb-0.5"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data?.data?.data?.length === 0 ? (
        <div className="py-20 text-center">
          <FaFilter className="text-gray-700 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-medium text-white mb-2">No videos found</h2>
          <p className="text-gray-500">Try adjusting your filters to find what you're looking for.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8">
            {data?.data?.data?.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
            {isLoading && page > 1 && (
              [...Array(5)].map((_, i) => (
                <div key={`loading-${i}`}>
                  <div className="aspect-video bg-dark-800 rounded-md border border-dark-800 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-dark-800 rounded animate-pulse w-3/4 mb-0.5"></div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {data?.data?.pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12 mb-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-3 py-1.5 bg-dark-900 hover:bg-dark-800 border border-dark-700 rounded-md text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaChevronLeft size={12} />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2">
                {[...Array(data?.data?.pages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  // Show only current page, 2 pages before and after
                  if (
                    pageNum === 1 ||
                    pageNum === data?.data?.pages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
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
                  }
                  // Show ellipsis
                  if (pageNum === page - 2 || pageNum === page + 2) {
                    return <span key={idx} className="text-gray-600">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(data?.data?.pages, p + 1))}
                disabled={page === data?.data?.pages}
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

export default Browse;
