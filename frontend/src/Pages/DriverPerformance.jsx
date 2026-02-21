import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search, Plus, Edit2, Trash2, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NewDriverForm } from '@/components/NewDriverForm';
import { driverApi } from '@/lib/driver';
import { authApi } from '@/lib/auth';

export default function DriverPerformance() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [groupBy, setGroupBy] = useState('none');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch drivers from backend
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await driverApi.getAllDrivers();
      
      if (response.success && response.data) {
        const formattedDrivers = response.data.map(driver => ({
          id: driver.id,
          name: driver.name,
          licenseNumber: driver.licenseNumber,
          expiryDate: driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A',
          completionRate: '0%', // Would need to calculate from trips
          safetyScore: driver.safetyScore || 0,
          complaints: 0, // Would need to track separately
          status: driver.status,
          ...driver // Keep all original data
        }));
        setDrivers(formattedDrivers);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDriver = async (formData) => {
    try {
      if (editingDriver) {
        // Update existing driver
        const response = await driverApi.updateDriver(editingDriver.id, formData);
        if (response.success) {
          await fetchDrivers();
          setEditingDriver(null);
        }
      } else {
        // Create new driver
        const response = await driverApi.createDriver(formData);
        if (response.success) {
          await fetchDrivers();
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error saving driver:', err);
      setError('Failed to save driver. Please try again.');
    }
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setIsFormOpen(true);
  };

  const handleDeleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        const response = await driverApi.deleteDriver(id);
        if (response.success) {
          await fetchDrivers();
        }
      } catch (err) {
        console.error('Error deleting driver:', err);
        setError('Failed to delete driver. Please try again.');
      }
    }
  };

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '🚗', label: 'Vehicle Registry', href: '/vehicle-registry' },
    { icon: '📍', label: 'Trip Dispatcher', href: '/trip-dispatcher' },
    { icon: '🔧', label: 'Maintenance', href: '/maintenance' },
    { icon: '💰', label: 'Expense Logging', href: '/expense-logging' },
    { icon: '👨‍✈️', label: 'Driver Performance', href: '/driver-performance' },
    { icon: '📈', label: 'Analytics', href: '/analytics' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Duty':
        return 'bg-green-500/20 text-green-400';
      case 'Taking a Break':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Suspended':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-600/20 text-slate-400';
    }
  };

  const getSafetyScoreColor = (score) => {
    const scoreNum = parseInt(score);
    if (scoreNum >= 90) return 'text-green-400';
    if (scoreNum >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Filter drivers
  let filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.licenseNumber.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort drivers
  if (sortBy === 'name') {
    filteredDrivers.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'safetyScore') {
    filteredDrivers.sort((a, b) => parseInt(b.safetyScore) - parseInt(a.safetyScore));
  } else if (sortBy === 'completionRate') {
    filteredDrivers.sort((a, b) => parseInt(b.completionRate) - parseInt(a.completionRate));
  } else if (sortBy === 'complaints') {
    filteredDrivers.sort((a, b) => a.complaints - b.complaints);
  }

  // Group drivers
  let groupedDrivers = filteredDrivers;
  if (groupBy === 'status') {
    const grouped = {};
    filteredDrivers.forEach((driver) => {
      if (!grouped[driver.status]) grouped[driver.status] = [];
      grouped[driver.status].push(driver);
    });
    groupedDrivers = grouped;
  }

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-center border-b border-slate-700">
          <div className="w-12 h-12 rounded-full border-2 border-amber-500 flex items-center justify-center bg-slate-950">
            <span className="text-amber-500 font-bold text-lg">FF</span>
          </div>
          {sidebarOpen && <span className="ml-3 font-bold text-amber-500">FleetFlow</span>}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.label === 'Driver Performance'
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-amber-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </a>
          ))}
        </nav>

        {/* Toggle Button */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-amber-500">Fleet Flow</h1>
              <p className="text-slate-400 text-sm mt-1">Driver Performance & Safety Profiles</p>
            </div>
            <Button onClick={() => {
              setEditingDriver(null);
              setIsFormOpen(true);
            }} className="bg-amber-500 hover:bg-amber-600 text-black font-medium flex items-center gap-2">
              <Plus size={20} />
              Add new Driver
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-3 m-4 rounded">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading drivers...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Controls Bar */}
          <div className="bg-slate-800 p-4 border-b border-slate-700 sticky top-0 z-40">
            <div className="flex gap-3 items-center flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              {/* Group By */}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm font-medium hover:border-amber-500 transition-colors"
              >
                <option value="none">Group by</option>
                <option value="status">Status</option>
              </select>

              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm font-medium hover:border-amber-500 transition-colors"
              >
                <option value="all">Filter</option>
                <option value="On Duty">On Duty</option>
                <option value="Taking a Break">Taking a Break</option>
                <option value="Suspended">Suspended</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm font-medium hover:border-amber-500 transition-colors"
              >
                <option value="name">Sort by Name</option>
                <option value="safetyScore">Sort by Safety Score</option>
                <option value="completionRate">Sort by Completion Rate</option>
                <option value="complaints">Sort by Complaints</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-800 border-b border-slate-700 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900">
                <tr className="border-b border-slate-700">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">License#</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Expiry</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Completion Rate</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Safety Score</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Complaints</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-amber-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {groupBy === 'status' && typeof groupedDrivers === 'object' && !Array.isArray(groupedDrivers)
                  ? Object.entries(groupedDrivers).map(([group, drivers]) => (
                      <tbody key={group}>
                        <tr className="bg-slate-700/20">
                          <td colSpan="7" className="px-6 py-2">
                            <span className="text-amber-400 font-semibold text-xs">{group}</span>
                          </td>
                        </tr>
                        {drivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-slate-100">{driver.name}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{driver.licenseNumber}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{driver.expiryDate}</td>
                            <td className="px-6 py-4 text-sm text-amber-400">{driver.completionRate}</td>
                            <td className={`px-6 py-4 text-sm font-semibold ${getSafetyScoreColor(driver.safetyScore)}`}>
                              {driver.safetyScore}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">{driver.complaints}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(driver.status)}`}>
                                {driver.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex gap-2">
                              <button
                                onClick={() => handleEditDriver(driver)}
                                className="p-1 text-amber-400 hover:bg-slate-700 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteDriver(driver.id)}
                                className="p-1 text-red-400 hover:bg-slate-700 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    ))
                  : filteredDrivers.map((driver) => (
                      <tr key={driver.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-100">{driver.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{driver.licenseNumber}</td>
                        <td className="px-6 py-4 text-sm text-slate-300">{driver.expiryDate}</td>
                        <td className="px-6 py-4 text-sm text-amber-400">{driver.completionRate}</td>
                        <td className={`px-6 py-4 text-sm font-semibold ${getSafetyScoreColor(driver.safetyScore)}`}>
                          {driver.safetyScore}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-300">{driver.complaints}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(driver.status)}`}>
                            {driver.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => handleEditDriver(driver)}
                            className="p-1 text-amber-400 hover:bg-slate-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="p-1 text-red-400 hover:bg-slate-700 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredDrivers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No drivers found</p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* New Driver Form Modal */}
      <NewDriverForm 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
          setEditingDriver(null);
        }} 
        onSubmit={handleAddDriver}
        editingDriver={editingDriver}
      />
    </div>
  );
}
