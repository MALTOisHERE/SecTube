import { useState } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FaChartBar, FaEye, FaThumbsUp, FaComments, FaUsers, FaVideo } from 'react-icons/fa';
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
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div className="flex bg-dark-800 rounded-lg p-1 border border-dark-700">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            value === opt.value
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-white'
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
  const colors = {
    primary: 'text-primary-500',
    green: 'text-green-500',
    red: 'text-red-500',
    amber: 'text-amber-500'
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-3 bg-dark-800 rounded w-20"></div>
            <div className="h-8 bg-dark-800 rounded w-24"></div>
          </div>
          <div className="w-10 h-10 bg-dark-800 rounded-lg"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:border-dark-700 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value || '0'}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg bg-dark-800 border border-dark-700 ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
};

// Main Analytics Component
const Analytics = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  const [timeRange, setTimeRange] = useState('30d');

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

  const { data: difficultyData, isLoading: difficultyLoading } = useQuery(
    ['analytics-difficulty', timeRange],
    () => analyticsAPI.getDifficultyDistribution({ timeRange }),
    { enabled: !!user?.isStreamer }
  );

  if (overviewError?.response?.status === 403) {
    addToast({ type: 'error', message: 'Streamer status required' });
    navigate('/settings#streamer');
    return null;
  }

  const stats = overviewData?.data?.data;
  const videos = videoData?.data?.data || [];
  const trends = trendData?.data?.data || [];
  const categories = categoryData?.data?.data || [];
  const difficulties = difficultyData?.data?.data || [];

  return (
    <div className="px-6 py-8 w-full">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Channel Analytics</h1>
            <p className="text-gray-400 text-sm">Performance metrics for your content</p>
          </div>
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col h-[450px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Views & Engagement Trends</h3>
            </div>
            <div className="flex-1 min-h-0">
              {trendLoading ? (
                <div className="w-full h-full bg-dark-800/50 animate-pulse rounded"></div>
              ) : trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={trends.map(t => ({ 
                      ...t, 
                      date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#4b5563" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#4b5563" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    />
                    <Line name="Views" type="monotone" dataKey="views" stroke="#0ea5e9" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line name="Likes" type="monotone" dataKey="likes" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <FaChartBar size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">No trend data available</p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="flex flex-col h-[450px]">
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Content Categories</h3>
              <div className="flex-1 min-h-0">
                {categoryLoading ? (
                  <div className="w-full h-full bg-dark-800/50 animate-pulse rounded"></div>
                ) : categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="_id"
                        stroke="none"
                      >
                        {categories.map((_, index) => (
                          <Cell key={index} fill={['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px', color: '#fff' }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">No data</div>
                )}
              </div>
            </Card>

            <Card className="flex flex-col h-[450px]">
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Difficulty Level</h3>
              <div className="flex-1 min-h-0">
                {difficultyLoading ? (
                  <div className="w-full h-full bg-dark-800/50 animate-pulse rounded"></div>
                ) : difficulties.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={difficulties}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="_id"
                        stroke="none"
                      >
                        {difficulties.map((entry) => (
                          <Cell 
                            key={entry._id} 
                            fill={
                              entry._id === 'Beginner' ? '#22c55e' : 
                              entry._id === 'Intermediate' ? '#0ea5e9' : 
                              entry._id === 'Advanced' ? '#f59e0b' : '#ef4444'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '12px', color: '#fff' }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">No data</div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Video Table */}
        <Card className="overflow-hidden">
          <div className="px-2 mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Video Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-dark-800">
                  <th className="pb-4 px-4">Video</th>
                  <th className="pb-4 px-4 text-right">Views</th>
                  <th className="pb-4 px-4 text-right">Likes</th>
                  <th className="pb-4 px-4 text-right">Engagement</th>
                  <th className="pb-4 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {videoLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-dark-800 rounded w-48"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-dark-800 rounded w-12 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-dark-800 rounded w-12 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-dark-800 rounded w-12 ml-auto"></div></td>
                      <td className="py-4 px-4"><div className="h-4 bg-dark-800 rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : videos.length > 0 ? (
                  videos.map((video) => (
                    <tr key={video._id} className="hover:bg-dark-800/30 transition-colors group">
                      <td className="py-4 px-4">
                        <Link to={`/video/${video._id}`} className="flex items-center gap-3">
                          <img 
                            src={getThumbnailUrl(video.thumbnail)} 
                            className="w-16 h-9 object-cover rounded border border-dark-800" 
                            onError={(e) => e.target.src = getThumbnailUrl()}
                            alt=""
                          />
                          <span className="font-medium text-gray-200 group-hover:text-primary-400 transition-colors truncate max-w-[200px] md:max-w-xs">
                            {video.title}
                          </span>
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-300 font-medium">{video.views.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right text-gray-400">{video.likeCount.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`text-xs font-bold ${video.engagementRate > 5 ? 'text-green-500' : 'text-gray-400'}`}>
                          {video.engagementRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-500 text-xs">
                        {formatDistanceToNow(new Date(video.uploadedAt), { addSuffix: true })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500 italic">No videos found for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
