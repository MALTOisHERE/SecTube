import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaEllipsisV, FaTrash, FaEye, FaLock, FaExclamationTriangle, FaGlobe, FaLink } from 'react-icons/fa';
import { getAvatarUrl, getThumbnailUrl } from '../config/constants';
import { useMutation, useQueryClient } from 'react-query';
import { videoAPI } from '../services/api';
import useToastStore from '../store/toastStore';
import ConfirmDialog from './ConfirmDialog';
import Z_INDEX from '../config/zIndex';
import { useDropdownPosition, getDropdownClasses } from '../hooks/useDropdownPosition';

const VideoCard = ({ video, showActions = false }) => {
  const [showMenu, setShowActionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVisibilityConfirm, setShowVisibilityConfirm] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState(null);
  const menuRef = useRef(null);
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  const menuPosition = useDropdownPosition(menuRef, showMenu, 200);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowActionsMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const deleteMutation = useMutation(() => videoAPI.deleteVideo(video._id), {
    onSuccess: () => {
      queryClient.invalidateQueries('channel-videos');
      addToast({ type: 'success', message: 'Video deleted successfully' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: err.response?.data?.message || 'Delete failed' });
    }
  });

  const visibilityMutation = useMutation((visibility) => 
    videoAPI.updateVideo(video._id, { visibility }), {
    onSuccess: () => {
      queryClient.invalidateQueries('channel-videos');
      addToast({ type: 'success', message: 'Visibility updated' });
      setShowActionsMenu(false);
      setShowVisibilityConfirm(false);
    }
  });

  const handleVisibilityClick = (visibility) => {
    if (visibility === video.visibility) {
      setShowActionsMenu(false);
      return;
    }
    setPendingVisibility(visibility);
    setShowVisibilityConfirm(true);
    setShowActionsMenu(false);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const getVisibilityIcon = (v) => {
    if (v === 'public') return <FaGlobe size={12} />;
    if (v === 'unlisted') return <FaLink size={12} />;
    return <FaLock size={12} />;
  };

  return (
    <div className="flex flex-col group relative">
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

          {/* Status Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {video.processingStatus === 'failed' && (
              <div className="bg-red-600 text-white p-1 rounded shadow-lg" title="Processing Failed">
                <FaExclamationTriangle size={12} />
              </div>
            )}
            {video.visibility !== 'public' && (
              <div className="bg-dark-900/90 text-gray-300 p-1 rounded border border-dark-700 shadow-lg" title={video.visibility}>
                {getVisibilityIcon(video.visibility)}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="flex gap-2">
        {/* Channel avatar */}
        <Link to={`/channel/${video.uploader?.username}`} className="flex-shrink-0">
          <img
            src={getAvatarUrl(video.uploader?.avatar)}
            alt={video.uploader?.displayName || video.uploader?.username}
            className="w-8 h-8 rounded-full border border-dark-800"
            onError={(e) => {
              e.target.src = getAvatarUrl('default-avatar.svg');
            }}
          />
        </Link>

        {/* Video details */}
        <div className="flex-1 min-w-0 pr-6">
          <Link to={`/video/${video._id}`}>
            <h3 className="text-sm font-medium text-white line-clamp-2 mb-0.5 leading-snug hover:text-primary-400 transition-colors">
              {video.title}
            </h3>
          </Link>

          <Link
            to={`/channel/${video.uploader?.username}`}
            className="block text-xs text-gray-500 hover:text-gray-400 mb-0.5"
          >
            {video.uploader?.displayName || video.uploader?.username}
          </Link>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>{formatViews(video.views)} views</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="absolute right-0 bottom-8 sm:bottom-10" ref={menuRef}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowActionsMenu(!showMenu);
              }}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-dark-800 rounded-full transition-colors relative z-30"
            >
              <FaEllipsisV size={14} />
            </button>

            {showMenu && (
              <div 
                className={`absolute right-0 ${getDropdownClasses(menuPosition)} w-48 bg-dark-900 border border-dark-700 rounded-md shadow-2xl py-1 z-50 overflow-hidden`}
                style={{ zIndex: Z_INDEX.DROPDOWN }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 border-b border-dark-800 mb-1">
                  Manage Content
                </div>
                
                {video.processingStatus === 'failed' ? (
                  <div className="px-4 py-2 text-[10px] text-red-500/70 italic leading-tight">
                    Failed videos are locked to Private and cannot be published.
                  </div>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleVisibilityClick('public');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors ${video.visibility === 'public' ? 'text-primary-500 bg-primary-500/5' : 'text-gray-400 hover:bg-dark-800 hover:text-white'}`}
                    >
                      <FaGlobe size={12} /> Make Public
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleVisibilityClick('unlisted');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors ${video.visibility === 'unlisted' ? 'text-primary-500 bg-primary-500/5' : 'text-gray-400 hover:bg-dark-800 hover:text-white'}`}
                    >
                      <FaLink size={12} /> Make Unlisted
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleVisibilityClick('private');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors ${video.visibility === 'private' ? 'text-primary-500 bg-primary-500/5' : 'text-gray-400 hover:bg-dark-800 hover:text-white'}`}
                    >
                      <FaLock size={12} /> Make Private
                    </button>
                  </>
                )}
                
                <div className="h-px bg-dark-800 my-1"></div>
                
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <FaTrash size={12} /> Delete Permanently
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Content"
        message="Are you sure you want to permanently delete this video? This action cannot be undone."
        confirmText="Delete"
      />

      <ConfirmDialog
        isOpen={showVisibilityConfirm}
        onClose={() => setShowVisibilityConfirm(false)}
        onConfirm={() => visibilityMutation.mutate(pendingVisibility)}
        title="Update Visibility"
        message={`Are you sure you want to change the visibility to ${pendingVisibility}? This will change who can discover and watch this content.`}
        confirmText="Update"
        type="info"
      />
    </div>
  );
};

export default VideoCard;
