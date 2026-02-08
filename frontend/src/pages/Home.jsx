import { useState } from 'react';
import { useQuery } from 'react-query';
import { videoAPI } from '../services/api';
import VideoCard from '../components/VideoCard';

const categories = [
  'All',
  'Bug Bounty',
  'Web Application Security',
  'Network Security',
  'Penetration Testing',
  'CTF Writeup',
  'Malware Analysis',
  'Reverse Engineering',
];

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: videosData, isLoading } = useQuery(
    ['home-videos', selectedCategory],
    () => videoAPI.getVideos({
      limit: 24,
      sort: 'popular',
      ...(selectedCategory !== 'All' && { category: selectedCategory })
    })
  );

  return (
    <div className="px-6 py-6">
      {/* Category chips */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              category === selectedCategory
                ? 'bg-white text-black'
                : 'bg-dark-800 text-white hover:bg-dark-700'
            }`}
          >
            {category}
          </button>
        ))}
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {videosData?.data?.data?.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
