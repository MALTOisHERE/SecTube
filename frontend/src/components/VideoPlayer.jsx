import { useState, useRef, useEffect } from 'react';
import { FaCog, FaCheck, FaPlay, FaPause } from 'react-icons/fa';
import { getVideoUrl } from '../config/constants';

const VideoPlayer = ({ video }) => {
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const qualityMenuRef = useRef(null);
  const videoRef = useRef(null);

  // Get available qualities
  const qualities = video.videoFile?.processedPaths || {};
  const qualityKeys = Object.keys(qualities).filter(q => q !== 'original').sort((a, b) => {
    const getHeight = (q) => parseInt(q) || 9999;
    return getHeight(b) - getHeight(a);
  });

  // Format quality label
  const getQualityLabel = (quality) => {
    const height = parseInt(quality);
    if (height >= 1080) return `${quality} (Full HD)`;
    if (height >= 720) return `${quality} (HD)`;
    return quality;
  };

  // Use highest quality available as default
  const defaultQuality = selectedQuality || qualityKeys[0] || 'original';
  const videoPath = qualities[defaultQuality] || qualities.original;

  // If videoPath is already a full URL (Cloudinary), use as is
  // Otherwise, prepend /videos/ for local storage
  const videoUrl = (videoPath && (videoPath.startsWith('http://') || videoPath.startsWith('https://')))
    ? videoPath
    : getVideoUrl(`/videos/${videoPath}`);

  // Close quality menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(event.target)) {
        setShowQualityMenu(false);
      }
    };

    if (showQualityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQualityMenu]);

  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Show play button briefly when play/pause is toggled
  const handlePlayPauseClick = () => {
    togglePlayPause();
    setShowPlayButton(true);
    setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowPlayButton(false);
      }
    }, 500);
  };

  // Handle double click for fullscreen
  const handleDoubleClick = () => {
    toggleFullscreen();
  };

  // Track video play/pause state
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setTimeout(() => setShowPlayButton(false), 500);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowPlayButton(true);
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
    };
  }, [videoUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle if the video player is in focus or no input is focused
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="w-full bg-black rounded-md overflow-hidden group">
      <div className="relative">
        <style>{`
          video::-webkit-media-controls-overlay-play-button {
            display: none;
          }
          video::-webkit-media-controls-start-playback-button {
            display: none;
          }
        `}</style>
        <video
          ref={videoRef}
          key={videoUrl}
          className="w-full aspect-video"
          controls
          preload="metadata"
          playsInline
          src={videoUrl}
          onDoubleClick={handleDoubleClick}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Clickable overlay for play/pause */}
        <div
          onClick={handlePlayPauseClick}
          onDoubleClick={handleDoubleClick}
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          style={{ bottom: '40px' }} // Don't cover the controls bar
        >
          {/* Play/Pause overlay button */}
          <div
            className={`w-20 h-20 flex items-center justify-center rounded-full bg-black bg-opacity-70 backdrop-blur-sm border border-gray-600 shadow-2xl transition-opacity duration-300 ${
              showPlayButton || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            {isPlaying ? (
              <FaPause className="text-white text-2xl ml-0" />
            ) : (
              <FaPlay className="text-white text-2xl ml-1" />
            )}
          </div>
        </div>

        {/* Quality selector - only shows on hover */}
        {qualityKeys.length > 0 && (
          <div ref={qualityMenuRef} className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => setShowQualityMenu(!showQualityMenu)}
              className="flex items-center gap-2 bg-black bg-opacity-80 hover:bg-opacity-90 text-white px-3 py-1.5 rounded-md text-sm font-medium transition border border-gray-700 shadow-lg backdrop-blur-sm"
              title="Quality settings"
            >
              <FaCog size={14} />
              <span>{defaultQuality}</span>
            </button>

            {showQualityMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-dark-900 rounded-md shadow-xl border border-dark-700 py-1.5 z-50">
                <div className="px-3 py-2 border-b border-dark-700">
                  <p className="text-xs font-medium text-gray-400">Quality</p>
                </div>
                {qualityKeys.map((quality) => (
                  <button
                    key={quality}
                    onClick={() => handleQualityChange(quality)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-dark-800 transition text-left text-sm"
                  >
                    <span className={`${selectedQuality === quality || (!selectedQuality && quality === qualityKeys[0]) ? 'text-primary-400 font-medium' : 'text-gray-300'}`}>
                      {getQualityLabel(quality)}
                    </span>
                    {(selectedQuality === quality || (!selectedQuality && quality === qualityKeys[0])) && (
                      <FaCheck size={12} className="text-primary-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
