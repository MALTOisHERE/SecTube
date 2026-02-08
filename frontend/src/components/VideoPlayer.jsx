import { useState } from 'react';
import { getVideoUrl } from '../config/constants';

const VideoPlayer = ({ video }) => {
  const [selectedQuality, setSelectedQuality] = useState(null);

  // Get available qualities
  const qualities = video.videoFile?.processedPaths || {};
  const qualityKeys = Object.keys(qualities).filter(q => q !== 'original').sort((a, b) => {
    const getHeight = (q) => parseInt(q) || 9999;
    return getHeight(b) - getHeight(a);
  });

  // Use highest quality available as default
  const defaultQuality = selectedQuality || qualityKeys[0] || 'original';
  const videoUrl = getVideoUrl(`/videos/${qualities[defaultQuality] || qualities.original}`);

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden">
      <div className="relative">
        <video
          key={videoUrl}
          className="w-full aspect-video"
          controls
          preload="metadata"
          playsInline
          src={videoUrl}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Quality selector */}
        {qualityKeys.length > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <select
              value={selectedQuality || qualityKeys[0]}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {qualityKeys.map((quality) => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
