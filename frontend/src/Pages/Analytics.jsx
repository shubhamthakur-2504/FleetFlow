import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { analyticsApi } from '../lib/analytics';

export default function Analytics() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // month, week, year
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [costliestVehicles, setCostliestVehicles] = useState([]);
  const [utilizationData, setUtilizationData] = useState([]);
  const [overallMetrics, setOverallMetrics] = useState(null);
  const [financialSummary, setFinancialSummary] = useState(null);

  // Fetch analytics data
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Fetch time series when timeRange changes
  useEffect(() => {
    fetchTimeSeriesData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [overall, vehicles, util, financial] = await Promise.all([
        analyticsApi.getOverallAnalytics(),
        analyticsApi.getVehicleAnalytics(5),
        analyticsApi.getVehicleUtilization(),
        analyticsApi.getFinancialSummary()
      ]);

      setOverallMetrics(overall.data || null);
      
      if (vehicles.data) {
        setCostliestVehicles(vehicles.data.map((v) => ({
          name: v.licensePlate,
          cost: v.totalCost
        })));
      }

      setUtilizationData(util.data || []);
      setFinancialSummary(financial.data || null);

      // Fetch initial time series
      await fetchTimeSeriesData();
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimeSeriesData = async () => {
    try {
      const response = await analyticsApi.getTimeSeriesAnalytics(timeRange);
      if (response.data) {
        setTimeSeriesData(response.data);
      }
    } catch (err) {
      console.error('Error fetching time series:', err);
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
                item.label === 'Analytics'
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
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
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
              <p className="text-slate-400 text-sm mt-1">Operational Analytics & Financial Reports</p>
            </div>
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
                <p className="text-slate-400">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <>
          {/* Key Metrics */}
          <div className="bg-slate-800 border-b border-slate-700 p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-green-500/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400 mt-2">₹{overallMetrics?.totalRevenue?.toLocaleString() || '0'}</p>
              <p className="text-slate-500 text-xs mt-1">All Time</p>
            </div>
            <div className="bg-slate-950 border border-orange-500/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-orange-400 mt-2">₹{overallMetrics?.totalExpense?.toLocaleString() || '0'}</p>
              <p className="text-slate-500 text-xs mt-1">Fuel + Maintenance</p>
            </div>
            <div className="bg-slate-950 border border-blue-500/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-medium">Net Profit</p>
              <p className="text-2xl font-bold text-blue-400 mt-2">₹{overallMetrics?.netProfit?.toLocaleString() || '0'}</p>
              <p className="text-slate-500 text-xs mt-1">Full Margin</p>
            </div>
            <div className="bg-slate-950 border border-purple-500/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm font-medium">ROI</p>
              <p className="text-2xl font-bold text-purple-400 mt-2">{overallMetrics?.roi || '0'}%</p>
              <p className="text-slate-500 text-xs mt-1">Return on Investment</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex gap-3">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'week'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'month'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'year'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              This Year
            </button>
          </div>

          {/* Charts Grid */}
          <div className="p-6 space-y-6">
            {/* Revenue vs Costs Trend */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Revenue vs Operating Costs</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="period" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#f59e0b' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="fuelCost" stroke="#ef4444" strokeWidth={2} name="Fuel Cost" />
                  <Line type="monotone" dataKey="maintenanceCost" stroke="#f59e0b" strokeWidth={2} name="Maintenance" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ROI Trend & Top Costliest Vehicles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ROI Trend */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">Fleet ROI Trend</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="period" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#f59e0b' }}
                    />
                    <Bar dataKey="roi" fill="#3b82f6" radius={[8, 8, 0, 0]} name="ROI %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top 5 Costliest Vehicles */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">Top 5 Costliest Vehicles</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={costliestVehicles}
                    layout="vertical"
                    margin={{ left: 50, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={45} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#f59e0b' }}
                      formatter={(value) => `Rs. ${value}K`}
                    />
                    <Bar dataKey="cost" fill="#ef4444" radius={[0, 8, 8, 0]} name="Monthly Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fleet Utilization & Fuel Efficiency */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fleet Utilization */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">Fleet Utilization</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={utilizationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {utilizationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      formatter={(value) => `${value}%`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Fuel Efficiency Trend */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4">Fuel Efficiency Trend (kM/L)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="period" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#f59e0b' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="roi" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      name="Efficiency (kM/L)"
                      dot={{ fill: '#10b981', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Financial Summary Table */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-amber-400 mb-4">Financial Summary of Month</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-amber-400">Month</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-amber-400">Revenue</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-amber-400">Fuel Cost</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-amber-400">Maintenance</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-amber-400">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {financialSummary.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-100">{row.month}</td>
                        <td className="px-4 py-3 text-sm text-green-400 font-medium">Rs. {row.revenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-red-400 font-medium">Rs. {row.fuelCost.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-orange-400 font-medium">Rs. {row.maintenance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-blue-400 font-medium">Rs. {row.netProfit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
