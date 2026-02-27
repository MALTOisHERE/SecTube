import { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Z_INDEX } from '../config/zIndex';

const DevBanner = () => {
  // Dev banner states: 'entering' | 'visible' | 'leaving' | 'hidden'
  const [bannerStatus, setBannerStatus] = useState(() => {
    return localStorage.getItem('hasSeenDevBanner') ? 'hidden' : 'entering';
  });

  useEffect(() => {
    if (bannerStatus === 'hidden') return;

    // Phase 1: Slide Up (entering -> visible)
    const enterTimer = setTimeout(() => setBannerStatus('visible'), 500);

    // Phase 2: Start Sliding Down after 10s
    const leaveTimer = setTimeout(() => {
      setBannerStatus('leaving');
      localStorage.setItem('hasSeenDevBanner', 'true');
    }, 10000);

    // Phase 3: Completely remove from DOM after slide down animation completes
    const hideTimer = setTimeout(() => setBannerStatus('hidden'), 10500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, [bannerStatus]);

  const handleCloseBanner = () => {
    setBannerStatus('leaving');
    localStorage.setItem('hasSeenDevBanner', 'true');
    setTimeout(() => setBannerStatus('hidden'), 500);
  };

  if (bannerStatus === 'hidden') return null;

  return (
    <div
      className={`bg-red-600/90 text-white py-3 px-4 text-center text-xs font-bold uppercase tracking-[0.2em] fixed bottom-0 left-0 right-0 backdrop-blur-sm flex items-center justify-center gap-3 transition-all duration-500 ${
        bannerStatus === 'entering' || bannerStatus === 'leaving' ? 'animate-slideDown' : 'animate-slideUp'
      }`}
      style={{ zIndex: Z_INDEX.DEV_BANNER }}
    >
      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
      Platform Status: Development Mode // Unauthorized usage restricted // Developed by <a href="https://github.com/MALTOisHERE" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-200 transition-colors">MALTO</a>
      <button
        onClick={handleCloseBanner}
        className="absolute right-4 hover:text-gray-300 transition-colors"
        aria-label="Close banner"
      >
        <FaTimes size={14} />
      </button>
    </div>
  );
};

export default DevBanner;
