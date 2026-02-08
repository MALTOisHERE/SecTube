import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { videoAPI } from '../services/api';
import VideoCard from '../components/VideoCard';
import { FaSearch } from 'react-icons/fa';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading } = useQuery(
    ['search', query],
    () => videoAPI.searchVideos({ q: query }),
    {
      enabled: !!query,
    }
  );

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-medium mb-2">Search results for "{query}"</h1>
        {data?.data?.total > 0 && (
          <p className="text-sm text-gray-400">{data.data.total} results</p>
        )}
      </div>

      {!query ? (
        <div className="text-center py-12">
          <FaSearch className="text-4xl text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400">Enter a search query</p>
        </div>
      ) : isLoading ? (
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
      ) : data?.data?.data?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">No results found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {data?.data?.data?.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
