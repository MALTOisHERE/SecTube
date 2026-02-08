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
        <div className="relative aspect-video bg-dark-800 rounded-xl overflow-hidden mb-3">
          <img
            src={getThumbnailUrl(video.thumbnail)}
            alt={video.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/640x360/1a1a1a/666666?text=No+Thumbnail';
            }}
          />
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 px-1.5 py-0.5 rounded text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="flex gap-3">
        {/* Channel avatar */}
        <Link to={`/channel/${video.uploader?.username}`} className="flex-shrink-0">
          <img
            src={getAvatarUrl(video.uploader?.avatar)}
            alt={video.uploader?.displayName}
            className="w-9 h-9 rounded-full"
            onError={(e) => {
              e.target.src = getAvatarUrl('default-avatar.svg');
            }}
          />
        </Link>

        {/* Video details */}
        <div className="flex-1 min-w-0">
          <Link to={`/video/${video._id}`}>
            <h3 className="text-sm font-medium text-white line-clamp-2 mb-1 leading-snug">
              {video.title}
            </h3>
          </Link>

          <Link
            to={`/channel/${video.uploader?.username}`}
            className="block text-sm text-gray-400 hover:text-gray-300 mb-1"
          >
            {video.uploader?.displayName}
          </Link>

          <div className="flex items-center gap-1 text-xs text-gray-400">
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
