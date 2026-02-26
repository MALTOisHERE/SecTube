import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import useToastStore from '../store/toastStore';
import Card from '../components/Card';
import { FaUsers, FaVideo, FaComments, FaEye, FaUserShield, FaBan, FaTrash, FaCheckCircle, FaSearch, FaFilter, FaInfoCircle, FaCopy } from 'react-icons/fa';
import { format } from 'date-fns';
import { getThumbnailUrl, getAvatarUrl } from '../config/constants';
import ConfirmDialog from '../components/ConfirmDialog';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { data: statsData, isLoading: statsLoading } = useQuery('admin-stats', adminAPI.getStats);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview stats={statsData?.data?.data} loading={statsLoading} />;
      case 'users':
        return <UserManagement />;
      case 'videos':
        return <VideoManagement />;
      default:
        return <AdminOverview stats={statsData?.data?.data} loading={statsLoading} />;
    }
  };

  return (
    <div className="px-6 py-8 w-full min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-dark-800 pb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FaUserShield className="text-primary-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">Platform management and administrative controls</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-dark-800 rounded-lg p-1 border border-dark-700">
            {[
              { id: 'overview', label: 'Overview', icon: FaEye },
              { id: 'users', label: 'Users', icon: FaUsers },
              { id: 'videos', label: 'Videos', icon: FaVideo }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="animate-fadeIn">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// --- Overview Sub-component ---
const AdminOverview = ({ stats, loading }) => {
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-dark-900 border border-dark-800 rounded-lg animate-pulse"></div>
      ))}
    </div>
  );

  const statItems = [
    { label: 'Total Users', value: stats?.totalUsers, icon: FaUsers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Videos', value: stats?.totalVideos, icon: FaVideo, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total Views', value: stats?.totalViews, icon: FaEye, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Blocked Users', value: stats?.blockedUsersCount, icon: FaBan, color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statItems.map((item) => (
          <Card key={item.label} className="hover:border-dark-700 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                <p className="text-3xl font-bold text-white">{(item.value || 0).toLocaleString()}</p>
              </div>
              <div className={`p-2.5 rounded-lg bg-dark-800 border border-dark-700 ${item.color}`}>
                <item.icon size={20} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-primary-500/10">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <FaInfoCircle className="text-primary-500" />
            Platform Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-800/30 rounded-lg border border-dark-800">
              <div className="flex items-center gap-2 text-green-500 text-xs font-bold mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Database
              </div>
              <p className="text-sm text-gray-400">Systems operational. All data clusters are synchronized.</p>
            </div>
            <div className="p-4 bg-dark-800/30 rounded-lg border border-dark-800">
              <div className="flex items-center gap-2 text-primary-500 text-xs font-bold mb-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                API Services
              </div>
              <p className="text-sm text-gray-400">All administrative endpoints are healthy and responsive.</p>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col justify-center items-center text-center py-8">
          <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mb-4 border border-primary-500/20">
            <FaCheckCircle className="text-primary-500" size={24} />
          </div>
          <h4 className="text-white font-bold mb-1">System Healthy</h4>
          <p className="text-gray-500 text-xs px-4">No critical issues or alerts requiring attention at this time.</p>
        </Card>
      </div>
    </div>
  );
};

// --- User Management Sub-component ---
const UserManagement = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const { data: usersData, isLoading } = useQuery(['admin-users', page], () => adminAPI.getUsers({ page }));

  const filteredUsers = useMemo(() => {
    if (!usersData?.data?.data) return [];
    return usersData.data.data.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usersData, searchTerm]);

  const updateMutation = useMutation(
    ({ id, data, username }) => adminAPI.updateUser(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries('admin-users');
        queryClient.invalidateQueries('admin-stats');
        
        let msg = `Profile updated`;
        if (variables.data.isBlocked !== undefined) {
          msg = variables.data.isBlocked 
            ? `Access neutralized` 
            : `Access restored`;
        } else if (variables.data.role) {
          msg = `Authorization elevated`;
        }
        
        addToast({ type: 'success', message: msg });
      }
    }
  );

  const deleteMutation = useMutation(
    ({ id, username }) => adminAPI.deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        queryClient.invalidateQueries('admin-stats');
        addToast({ type: 'success', message: `Identity permanently purged` });
      }
    }
  );

  const handleBlockClick = (user) => {
    const isBlocking = !user.isBlocked;
    setConfirmState({
      isOpen: true,
      title: isBlocking ? 'Neutralize User Access' : 'Restore User Access',
      message: isBlocking 
        ? `Are you sure you want to block ${user.username}? They will be immediately disconnected from all services.`
        : `Restore full platform access to ${user.username}?`,
      type: isBlocking ? 'danger' : 'info',
      onConfirm: () => updateMutation.mutate({
        id: user._id,
        username: user.username,
        data: { isBlocked: isBlocking, blockReason: isBlocking ? 'Administrative Action' : '' }
      })
    });
  };

  const handleDeleteClick = (user) => {
    setConfirmState({
      isOpen: true,
      title: 'IRREVERSIBLE DATA PURGE',
      message: `Permanently delete ${user.username} and ALL their uploaded content? This action cannot be undone.`,
      type: 'danger',
      onConfirm: () => deleteMutation.mutate({ id: user._id, username: user.username })
    });
  };

  const copyId = (id, type = 'User') => {
    navigator.clipboard.writeText(id);
    addToast({ type: 'info', message: `${type} ID copied to clipboard` });
  };

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-dark-900 border border-dark-800 rounded-lg animate-pulse"></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      <Card className="overflow-hidden p-0 border-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-dark-950 border-b border-dark-800">
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-dark-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getAvatarUrl(user.avatar)} 
                        className="w-9 h-9 rounded-lg border border-dark-700 object-cover" 
                        onError={(e) => e.target.src = '/default-avatar.svg'} 
                        alt="" 
                      />
                      <div>
                        <p className="font-bold text-white">{user.displayName || user.username}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      type="button"
                      onClick={() => copyId(user._id)}
                      className="flex items-center gap-2 text-[10px] font-mono text-gray-500 hover:text-primary-400 hover:bg-dark-800 px-2 py-1 rounded transition-all cursor-pointer group/id active:scale-95 border border-transparent hover:border-dark-700"
                      title="Click to copy full ID"
                    >
                      <span>{user._id.substring(0, 8)}...</span>
                      <FaCopy className="opacity-0 group-hover/id:opacity-100 transition-opacity" size={10} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {user.isBlocked ? (
                      <span className="px-2 py-0.5 bg-red-600/10 text-red-500 border border-red-500/20 rounded text-[10px] font-black uppercase tracking-tighter">Blocked</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-green-600/10 text-green-500 border border-green-500/20 rounded text-[10px] font-black uppercase tracking-tighter">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={user.role} 
                      onChange={(e) => updateMutation.mutate({ 
                        id: user._id, 
                        username: user.username,
                        data: { role: e.target.value } 
                      })}
                      className="bg-dark-800 border border-dark-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="streamer">Streamer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleBlockClick(user)}
                        className={`p-2 rounded-lg transition-all ${user.isBlocked ? 'bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white' : 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white'}`}
                        title={user.isBlocked ? 'Unblock' : 'Block'}
                      >
                        {user.isBlocked ? <FaCheckCircle size={14} /> : <FaBan size={14} />}
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user)}
                        className="p-2 bg-dark-800 text-gray-500 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                        title="Delete User"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.title.includes('Restore') ? 'Restore' : 'Confirm'}
      />
    </div>
  );
};

// --- Video Management Sub-component ---
const VideoManagement = () => {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Confirmation state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const { data: videosData, isLoading } = useQuery(['admin-videos', page], () => adminAPI.getVideos({ page }));

  const filteredVideos = useMemo(() => {
    if (!videosData?.data?.data) return [];
    return videosData.data.data.filter(v => 
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.uploader?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [videosData, searchTerm]);

  const updateMutation = useMutation(
    ({ id, data, title }) => adminAPI.updateVideo(id, data),
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries('admin-videos');
        
        let msg = `Metadata updated`;
        if (variables.data.visibility) {
          msg = variables.data.visibility === 'public'
            ? `Asset restored to public vault`
            : `Asset visibility restricted`;
        }
        
        addToast({ type: 'success', message: msg });
      }
    }
  );

  const handleVisibilityClick = (video) => {
    const isRestricting = video.visibility === 'public';
    setConfirmState({
      isOpen: true,
      title: isRestricting ? 'Restrict Media Asset' : 'Restore Media Asset',
      message: isRestricting 
        ? `Hide "${video.title}" from public feeds? This will make the video private immediately.`
        : `Restore public visibility for "${video.title}"?`,
      type: isRestricting ? 'danger' : 'info',
      onConfirm: () => updateMutation.mutate({ 
        id: video._id, 
        title: video.title,
        data: { visibility: isRestricting ? 'private' : 'public' } 
      })
    });
  };

  const copyId = (id, type = 'Asset') => {
    navigator.clipboard.writeText(id);
    addToast({ type: 'info', message: `${type} ID copied to clipboard` });
  };

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-dark-900 border border-dark-800 rounded-lg animate-pulse"></div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search content vault..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-900 border border-dark-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
          Showing {filteredVideos.length} assets
        </div>
      </div>

      <Card className="overflow-hidden p-0 border-dark-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-dark-950 border-b border-dark-800">
              <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Media Asset</th>
                <th className="px-6 py-4">Asset ID</th>
                <th className="px-6 py-4">Uploader</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Views</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
              {filteredVideos.map((video) => (
                <tr key={video._id} className="hover:bg-dark-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Link to={`/video/${video._id}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                        <img 
                          src={getThumbnailUrl(video.thumbnail)} 
                          className="w-20 h-12 rounded object-cover border border-dark-700" 
                          alt="" 
                        />
                      </Link>
                      <div className="max-w-xs">
                        <Link to={`/video/${video._id}`} className="font-bold text-white truncate hover:text-primary-400 transition-colors">
                          {video.title}
                        </Link>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{video.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copyId(video._id);
                      }}
                      className="flex items-center gap-2 text-[10px] font-mono text-gray-500 hover:text-primary-400 hover:bg-dark-800 px-2 py-1 rounded transition-all cursor-pointer group/id active:scale-95 border border-transparent hover:border-dark-700"
                      title="Click to copy full ID"
                    >
                      <span>{video._id.substring(0, 8)}...</span>
                      <FaCopy className="opacity-0 group-hover/id:opacity-100 transition-opacity" size={10} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-gray-300">@{video.uploader?.username}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${video.visibility === 'public' ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 'bg-red-600/10 text-red-500 border border-red-500/20'}`}>
                      {video.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-400">
                    {video.views.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleVisibilityClick(video)}
                        className={`p-2 rounded-lg transition-all ${video.visibility === 'public' ? 'bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-green-600/10 text-green-500 hover:bg-green-600 hover:text-white'}`}
                        title={video.visibility === 'public' ? 'Restrict Asset' : 'Restore Asset'}
                      >
                        {video.visibility === 'public' ? <FaBan size={14} /> : <FaCheckCircle size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVideos.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-gray-500 italic">No assets found matching the criteria</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.title.includes('Restore') ? 'Restore' : 'Confirm'}
      />
    </div>
  );
};

export default Admin;
