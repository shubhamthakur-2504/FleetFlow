import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Search, AlertTriangle, TrendingUp, Package, LogOut, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/auth";
import { analyticsApi } from "@/lib/analytics";
import { vehicleApi } from "@/lib/vehicle";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh data every 30 seconds to show live fleet status
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch analytics data and vehicles in parallel
      const [analyticsData, vehiclesData, utilizationData] = await Promise.all([
        analyticsApi.getOverallAnalytics(),
        vehicleApi.getAllVehicles(),
        analyticsApi.getVehicleUtilization()
      ]);

      // Process vehicles data
      if (vehiclesData.data) {
        const formattedVehicles = vehiclesData.data.slice(0, 5).map((vehicle) => ({
          vehicle: `${vehicle.licensePlate} - ${vehicle.model}`,
          driver: vehicle.assignedDriver?.name || "Unassigned",
          status: vehicle.status || "Idle"
        }));
        setVehicles(formattedVehicles);
      }

      // Process analytics data for stats
      if (analyticsData.data) {
        const data = analyticsData.data;
        const { totalTrips = 0, totalRevenue = 0, totalExpense = 0, totalProfit = 0, roi = 0 } = data;
        
        // Calculate active vehicles from utilization data
        let activeVehicles = 0;
        let maintenanceAlerts = 0;
        if (utilizationData.data) {
          activeVehicles = utilizationData.data.activeCount || 0;
          maintenanceAlerts = utilizationData.data.idleCount || 0;
        }

        setStats([
          {
            title: "Active Fleet",
            value: activeVehicles.toString(),
            color: "text-green-400",
            bgColor: "border-green-400/30 bg-green-400/5"
          },
          {
            title: "Total Trips",
            value: totalTrips.toString(),
            color: "text-yellow-400",
            bgColor: "border-yellow-400/30 bg-yellow-400/5"
          },
          {
            title: "Revenue (₹)",
            value: (totalRevenue / 1000).toFixed(1) + "K",
            color: "text-amber-400",
            bgColor: "border-amber-400/30 bg-amber-400/5"
          }
        ]);
      }
      
      // Update last refresh time
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
      // Set default empty stats on error
      setStats([
        { title: "Active Fleet", value: "0", color: "text-green-400", bgColor: "border-green-400/30 bg-green-400/5" },
        { title: "Total Trips", value: "0", color: "text-yellow-400", bgColor: "border-yellow-400/30 bg-yellow-400/5" },
        { title: "Revenue (₹)", value: "0K", color: "text-amber-400", bgColor: "border-amber-400/30 bg-amber-400/5" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const menuItems = [
    { icon: "📊", label: "Dashboard", href: "/dashboard" },
    { icon: "🚗", label: "Vehicle Registry", href: "/vehicle-registry" },
    { icon: "📍", label: "Trip Dispatcher", href: "/trip-dispatcher" },
    { icon: "🔧", label: "Maintenance", href: "/maintenance" },
    { icon: "💰", label: "Expense Logging", href: "/expense-logging" },
    { icon: "📈", label: "Driver Performance", href: "/driver-performance" },
    { icon: "📊", label: "Analytics", href: "/analytics" },
  ];

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
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
                item.label === "Dashboard"
                  ? "bg-slate-800 text-amber-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-amber-400"
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
              <p className="text-slate-400 text-sm mt-1">Main Dashboard</p>
            </div>
            <div className="flex items-center gap-4 flex-1 max-w-md ml-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  placeholder="Search..."
                  className="pl-10 bg-[#1E293B] border-slate-600 text-slate-100"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-xs text-slate-400">
                <p>Updated: {lastRefresh.toLocaleTimeString()}</p>
                <p className="text-slate-500">Auto-refresh: 30s</p>
              </div>
              <button
                onClick={() => fetchDashboardData()}
                disabled={isLoading}
                className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 disabled:opacity-50 transition-colors"
                title="Refresh dashboard data"
              >
                <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-400">Loading dashboard data...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`border rounded-xl p-6 ${stat.bgColor} backdrop-blur-sm bg-[#1E293B]`}
                  >
                    <p className="text-slate-400 text-sm mb-2">{stat.title}</p>
                    <div className="flex items-end justify-between">
                      <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                      {stat.title === "Active Fleet" && <TrendingUp className={stat.color} size={24} />}
                      {stat.title === "Total Trips" && <AlertTriangle className={stat.color} size={24} />}
                      {stat.title === "Revenue (₹)" && <Package className={stat.color} size={24} />}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">Vehicle</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">Driver</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {vehicles.length > 0 ? (
                        vehicles.map((row, index) => (
                          <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-300">{row.vehicle}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{row.driver}</td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  row.status === "ACTIVE"
                                    ? "bg-green-500/20 text-green-400"
                                    : row.status === "IN_USE"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : row.status === "MAINTENANCE"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-slate-600/20 text-slate-400"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="px-6 py-4 text-center text-slate-400">
                            No vehicles available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
