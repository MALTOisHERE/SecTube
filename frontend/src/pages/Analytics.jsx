import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FaChartBar, FaEye, FaThumbsUp, FaComments, FaUsers, FaVideo, FaExclamationCircle } from 'react-icons/fa';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import useAuthStore from '../store/authStore';
import useToastStore from '../store/toastStore';
import { analyticsAPI } from '../services/api';
import Card from '../components/Card';
import { getThumbnailUrl } from '../config/constants';
import { formatDistanceToNow } from 'date-fns';

// Time Range Filter Component
const TimeRangeFilter = ({ value, onChange }) => {
  const options = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition border ${
            value === opt.value
              ? 'bg-primary-600 border-primary-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.3)]'
              : 'bg-dark-900 border-dark-800 text-gray-400 hover:border-dark-700 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color = 'primary', loading }) => {
  const colorClasses = {
    primary: 'text-primary-500 bg-primary-500/10',
    green: 'text-green-500 bg-green-500/10',
    red: 'text-red-500 bg-red-500/10',
    amber: 'text-amber-500 bg-amber-500/10'
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-3 bg-dark-800 rounded animate-pulse w-20 mb-3"></div>
            <div className="h-8 bg-dark-800 rounded animate-pulse w-24"></div>
          </div>
          <div className="w-12 h-12 bg-dark-800 rounded-xl animate-pulse"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
            {label}
          </p>
          <p className="text-3xl font-black text-white">
            {typeof value === 'number' ? value.toLocaleString() : value || '0'}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
};

// Chart Skeleton Component
const ChartSkeleton = () => (
  <Card>
    <div className="h-6 bg-dark-800 rounded animate-pulse w-32 mb-6"></div>
    <div className="h-[300px] bg-dark-800 rounded animate-pulse"></div>
  </Card>
);

// Empty State Component
const EmptyState = ({ icon: Icon = FaChartBar, title, message, action }) => (
  <Card className="flex flex-col items-center justify-center py-12">
    <Icon className="text-gray-700 mb-4" size={48} />
    <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
    <p className="text-gray-500 text-sm mb-4">{message}</p>
    {action}
  </Card>
);

// Trend Line Chart Component
const TrendChart = ({ data, loading }) => {
  if (loading) return <ChartSkeleton />;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Trend Data"
        message="No activity in this time period. Try selecting a different time range."
      />
    );
  }

  // Format dates for display
  const formattedData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-primary-500 rounded-full"></div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-white">
          Performance Trends
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="displayDate"
            stroke="#6b7280"
            style={{ fontSize: '11px', fontWeight: 'bold' }}
          />
          <YAxis stroke="#6b7280" style={{ fontSize: '11px', fontWeight: 'bold' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#9ca3af', fontWeight: 'bold', marginBottom: '4px' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="#0ea5e9"
            strokeWidth={3}
            dot={{ fill: '#0ea5e9', r: 4 }}
            activeDot={{ r: 6 }}
            fillOpacity={1}
            fill="url(#viewsGradient)"
          />
          <Line
            type="monotone"
            dataKey="likes"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Category Donut Chart Component
const CategoryChart = ({ data, loading }) => {
  if (loading) return <ChartSkeleton />;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Category Data"
        message="Upload videos in different categories to see distribution."
      />
    );
  }

  const COLORS = [
    '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ];

  // Format data for display (shorten long category names)
  const formattedData = data.map(item => ({
    ...item,
    displayName: item._id.length > 20 ? item._id.substring(0, 18) + '...' : item._id
  }));

  return (
    <Card>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-primary-500 rounded-full"></div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-white">
          Content Distribution
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={formattedData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
            nameKey="displayName"
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {formattedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value, name, props) => [value, props.payload._id]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
            formatter={(value, entry) => entry.payload._id}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

// Video Performance Table Component
const VideoPerformanceTable = ({ videos, loading }) => {
  const [sortBy, setSortBy] = useState('views');

  if (loading) {
    return (
      <Card>
        <div className="h-6 bg-dark-800 rounded animate-pulse w-48 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-dark-800 rounded animate-pulse"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <EmptyState
        icon={FaVideo}
        title="No Videos Yet"
        message="Upload your first video to see analytics"
        action={
          <Link to="/settings#upload">
            <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md font-bold text-sm uppercase tracking-widest transition">
              Upload Video
            </button>
          </Link>
        }
      />
    );
  }

  const getEngagementColor = (rate) => {
    if (rate >= 10) return 'text-green-500';
    if (rate >= 5) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary-500 rounded-full"></div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">
            Top Performing Videos
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-dark-800">
            <tr className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
              <th className="pb-3 text-left">Video</th>
              <th className="pb-3 text-right">Views</th>
              <th className="pb-3 text-right">Likes</th>
              <th className="pb-3 text-right">Comments</th>
              <th className="pb-3 text-right">Engagement</th>
              <th className="pb-3 text-left pl-4">Category</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video._id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition">
                <td className="py-3">
                  <Link to={`/video/${video._id}`} className="flex items-center gap-3">
                    <img
                      src={getThumbnailUrl(video.thumbnail)}
                      alt={video.title}
                      className="w-20 h-11 object-cover rounded border border-dark-800"
                      onError={(e) => {
                        e.target.src = '/default-thumbnail.svg';
                      }}
                    />
                    <div className="max-w-[250px]">
                      <p className="font-medium text-white truncate hover:text-primary-500 transition">
                        {video.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="text-right font-bold text-white">
                  {video.views.toLocaleString()}
                </td>
                <td className="text-right text-gray-400">
                  {video.likeCount.toLocaleString()}
                </td>
                <td className="text-right text-gray-400">
                  {video.commentCount.toLocaleString()}
                </td>
                <td className={`text-right font-bold ${getEngagementColor(video.engagementRate)}`}>
                  {video.engagementRate.toFixed(2)}%
                </td>
                <td className="text-left pl-4">
                  <span className="text-xs bg-dark-800 border border-dark-700 px-2 py-1 rounded text-gray-400">
                    {video.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// Main Analytics Page Component
const Analytics = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [timeRange, setTimeRange] = useState('30d');

  // Data fetching with React Query
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useQuery(
    ['analytics-overview', timeRange],
    () => analyticsAPI.getOverview({ timeRange }),
    { enabled: !!user?.isStreamer, retry: 1 }
  );

  const { data: videoData, isLoading: videoLoading } = useQuery(
    ['analytics-videos', timeRange],
    () => analyticsAPI.getVideoPerformance({ timeRange, limit: 20 }),
    { enabled: !!user?.isStreamer }
  );

  const { data: trendData, isLoading: trendLoading } = useQuery(
    ['analytics-trends', timeRange],
    () => analyticsAPI.getTrends({ timeRange }),
    { enabled: !!user?.isStreamer }
  );

  const { data: categoryData, isLoading: categoryLoading } = useQuery(
    ['analytics-categories', timeRange],
    () => analyticsAPI.getCategoryDistribution({ timeRange }),
    { enabled: !!user?.isStreamer }
  );

  // Handle errors
  if (overviewError) {
    if (overviewError.response?.status === 403) {
      addToast({ type: 'error', message: 'Streamer status required for analytics' });
      navigate('/settings#streamer');
      return null;
    }
  }

  const stats = overviewData?.data;
  const videos = Array.isArray(videoData?.data) ? videoData.data : [];
  const trends = Array.isArray(trendData?.data) ? trendData.data : [];
  const categories = Array.isArray(categoryData?.data) ? categoryData.data : [];

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400 text-sm">Track your video performance and channel growth</p>
        </div>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FaEye}
          label="Total Views"
          value={stats?.totalViews}
          loading={overviewLoading}
        />
        <StatCard
          icon={FaThumbsUp}
          label="Total Likes"
          value={stats?.totalLikes}
          color="green"
          loading={overviewLoading}
        />
        <StatCard
          icon={FaComments}
          label="Comments"
          value={stats?.totalComments}
          color="amber"
          loading={overviewLoading}
        />
        <StatCard
          icon={FaUsers}
          label="Subscribers"
          value={stats?.subscriberCount}
          color="primary"
          loading={overviewLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TrendChart data={trends} loading={trendLoading} />
        <CategoryChart data={categories} loading={categoryLoading} />
      </div>

      {/* Video Performance Table */}
      <VideoPerformanceTable videos={videos} loading={videoLoading} />
    </div>
  );
};

export default Analytics;
