import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaClock } from 'react-icons/fa';
import { getAvatarUrl, getThumbnailUrl } from '../config/constants';

const VideoCard = ({ video }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  return (
    <div className="flex flex-col">
      {/* Thumbnail */}
      <Link to={`/video/${video._id}`} className="relative">
        <div className="relative aspect-video bg-dark-900 rounded-md overflow-hidden mb-2 border border-dark-800">
          <img
            src={getThumbnailUrl(video.thumbnail)}
            alt={video.title}
            className="w-full h-full object-cover hover:opacity-90 transition-opacity duration-150"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/640x360/1a1a1a/666666?text=No+Thumbnail';
            }}
          />
          {/* Duration badge */}
          <div className="absolute bottom-1.5 right-1.5 bg-black bg-opacity-90 px-1.5 py-0.5 rounded text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="flex gap-2">
        {/* Channel avatar */}
        <Link to={`/channel/${video.uploader?.username}`} className="flex-shrink-0">
          <img
            src={getAvatarUrl(video.uploader?.avatar)}
            alt={video.uploader?.displayName}
            className="w-8 h-8 rounded-full border border-dark-800"
            onError={(e) => {
              e.target.src = getAvatarUrl('default-avatar.svg');
            }}
          />
        </Link>

        {/* Video details */}
        <div className="flex-1 min-w-0">
          <Link to={`/video/${video._id}`}>
            <h3 className="text-sm font-medium text-white line-clamp-2 mb-0.5 leading-snug hover:text-primary-400 transition-colors">
              {video.title}
            </h3>
          </Link>

          <Link
            to={`/channel/${video.uploader?.username}`}
            className="block text-xs text-gray-500 hover:text-gray-400 mb-0.5"
          >
            {video.uploader?.displayName}
          </Link>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
