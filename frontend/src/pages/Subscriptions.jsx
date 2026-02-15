import { FaBell } from 'react-icons/fa';

const Subscriptions = () => {
  return (
    <div className="px-6 py-12 min-h-[85vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-dark-900 border border-dark-800 rounded-full flex items-center justify-center">
            <FaBell className="text-gray-500" size={32} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-3">Subscriptions</h1>
        <p className="text-sm text-gray-400 mb-6">
          This feature is coming soon. You'll be able to see all videos from channels you're subscribed to in one convenient feed.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-900 border border-dark-800 rounded-md text-sm text-gray-500">
          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          Under Development
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
