import { useState, useEffect } from "react";
import { Menu, X, Search, Trash2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import NewServiceForm from "@/components/NewServiceForm";
import { maintenanceApi } from "@/lib/maintenance";
import { vehicleApi } from "@/lib/vehicle";
import { authApi } from "@/lib/auth";

export default function MaintenanceServiceLogs() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [filterType, setFilterType] = useState("all");
  const [groupBy, setGroupBy] = useState("none");

  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const hasEditPermission = userRole && ["ADMIN", "FLEET_MANAGER"].includes(userRole);

  const menuItems = [
    { icon: "📊", label: "Dashboard", href: "/dashboard" },
    { icon: "🚗", label: "Vehicle Registry", href: "/vehicle-registry" },
    { icon: "📍", label: "Trip Dispatcher", href: "/trip-dispatcher" },
    { icon: "🔧", label: "Maintenance", href: "/maintenance" },
    { icon: "💰", label: "Expense Logging", href: "/expense-logging" },
    { icon: "📈", label: "Driver Performance", href: "/driver-performance" },
    { icon: "📊", label: "Analytics", href: "/analytics" },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "Fuel":
        return "bg-blue-500/20 text-blue-400";
      case "Maintenance":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  // Fetch current user
  const fetchUser = async () => {
    try {
      const userResponse = await authApi.getUser();
      setUser(userResponse.data);
      setUserRole(userResponse.data?.role);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  // Fetch logs and vehicles from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const [logsResponse, vehiclesResponse] = await Promise.all([
        maintenanceApi.getAllLogs(),
        vehicleApi.getAllVehicles(),
      ]);
      setLogs(logsResponse.data || []);
      setVehicles(vehiclesResponse.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch logs");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchData();
  }, []);

  // Filter and sort logic
  let processedLogs = logs.filter((log) => {
    const vehicleName = log.vehicle?.model || `Vehicle ${log.vehicleId}`;
    const matchesSearch =
      vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toString().includes(searchTerm) ||
      log.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesType;
  });

  // Sort
  processedLogs = processedLogs.sort((a, b) => {
    if (sortBy === "date") {
      return new Date(b.date) - new Date(a.date);
    }
    if (sortBy === "type") return a.type.localeCompare(b.type);
    if (sortBy === "id") return b.id - a.id;
    if (sortBy === "cost") return parseFloat(b.cost) - parseFloat(a.cost);
    return 0;
  });

  // Group logic
  let groupedLogs = processedLogs;
  if (groupBy === "type") {
    const grouped = {};
    processedLogs.forEach((log) => {
      if (!grouped[log.type]) grouped[log.type] = [];
      grouped[log.type].push(log);
    });
    groupedLogs = grouped;
  } else if (groupBy === "vehicle") {
    const grouped = {};
    processedLogs.forEach((log) => {
      const vehicleName = log.vehicle?.model || `Vehicle ${log.vehicleId}`;
      if (!grouped[vehicleName]) grouped[vehicleName] = [];
      grouped[vehicleName].push(log);
    });
    groupedLogs = grouped;
  }

  const handleNewServiceSubmit = async (formData) => {
    try {
      setError("");
      setSuccessMessage("");
      await maintenanceApi.createLog(formData);
      setSuccessMessage("Log created successfully!");
      fetchData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create log");
      console.error("Error creating log:", err);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Are you sure you want to delete this log?")) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      await maintenanceApi.deleteLog(logId);
      setSuccessMessage("Log deleted successfully!");
      fetchData();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete log");
      console.error("Error deleting log:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN");
  };

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
                item.label === "Maintenance"
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
              <p className="text-slate-400 text-sm mt-1">Maintenance & Service Logs</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative min-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1E293B] border-slate-700 text-slate-100"
                />
              </div>
              {hasEditPermission ? (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  {showForm ? "Cancel" : "Create New Log"}
                </button>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-slate-300 font-bold rounded-lg cursor-not-allowed opacity-50" title="Only ADMIN and FLEET_MANAGER can create logs">
                  <Lock size={16} />
                  <span>Create New Log</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Loading State */}
          {loading ? (
            <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-12 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-400">Loading logs...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Service Logs Table */}
              <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                  <div className="flex gap-4 flex-wrap">
                    <select
                      value={groupBy}
                      onChange={(e) => setGroupBy(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-[#0F172A] border border-slate-700 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="none">Group by</option>
                      <option value="type">Type</option>
                      <option value="vehicle">Vehicle</option>
                    </select>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-[#0F172A] border border-slate-700 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="all">Filter Type</option>
                      <option value="Fuel">Fuel</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-[#0F172A] border border-slate-700 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="type">Sort by Type</option>
                      <option value="id">Sort by ID</option>
                      <option value="cost">Sort by Cost</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {groupBy === "none" ? (
                    <table className="w-full">
                      <thead className="bg-slate-800 border-b border-slate-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                            Log ID
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                            Vehicle
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                            Type
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                            Cost (₹)
                          </th>
                          {logs.some((log) => log.liters) && (
                            <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                              Liters
                            </th>
                          )}
                          <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                            Date
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {processedLogs.length > 0 ? (
                          processedLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-amber-400">{log.id}</td>
                              <td className="px-6 py-4 text-sm text-slate-300">
                                {log.vehicle?.model || `Vehicle ${log.vehicleId}`}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(
                                    log.type
                                  )}`}
                                >
                                  {log.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-300">₹{log.cost}</td>
                              {logs.some((l) => l.liters) && (
                                <td className="px-6 py-4 text-sm text-slate-300">
                                  {log.liters ? log.liters + " L" : "-"}
                                </td>
                              )}
                              <td className="px-6 py-4 text-sm text-slate-300">
                                {formatDate(log.date)}
                              </td>
                              <td className="px-6 py-4">
                                {hasEditPermission ? (
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                ) : (
                                  <span className="text-slate-500 cursor-not-allowed opacity-50" title="Only ADMIN and FLEET_MANAGER can delete logs">
                                    <Trash2 size={18} />
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="px-6 py-8 text-center text-slate-400">
                              No service logs found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-6 space-y-6">
                      {Object.entries(groupedLogs).map(([groupName, logs]) => (
                        <div key={groupName} className="space-y-3">
                          <h4 className="text-lg font-semibold text-amber-400 capitalize">
                            {groupName}
                          </h4>
                          <table className="w-full">
                            <thead className="bg-slate-800 border-b border-slate-700">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-amber-400">
                                  Log ID
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-amber-400">
                                  Vehicle
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-amber-400">
                                  Type
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-amber-400">
                                  Cost (₹)
                                </th>
                                {logs.some((log) => log.liters) && (
                                  <th className="px-4 py-2 text-left text-xs font-semibold text-amber-400">
                                    Liters
                                  </th>
                                )}
                                <th className="px-4 py-2 text-left text-xs font-semibold text-amber-400">
                                  Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-amber-400">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                              {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                                  <td className="px-4 py-2 text-xs font-semibold text-amber-400">{log.id}</td>
                                  <td className="px-4 py-2 text-xs text-slate-300">
                                    {log.vehicle?.model || `Vehicle ${log.vehicleId}`}
                                  </td>
                                  <td className="px-4 py-2">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(
                                        log.type
                                      )}`}
                                    >
                                      {log.type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-xs text-slate-300">₹{log.cost}</td>
                                  {logs.some((l) => l.liters) && (
                                    <td className="px-4 py-2 text-xs text-slate-300">
                                      {log.liters ? log.liters + " L" : "-"}
                                    </td>
                                  )}
                                  <td className="px-4 py-2 text-xs text-slate-300">
                                    {formatDate(log.date)}
                                  </td>
                                  <td className="px-4 py-2">
                                    {hasEditPermission ? (
                                      <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="text-red-400 hover:text-red-300 transition-colors"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    ) : (
                                      <span className="text-slate-500 cursor-not-allowed opacity-50" title="Only ADMIN and FLEET_MANAGER can delete logs">
                                        <Trash2 size={18} />
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>
            </>
          )}
        </div>
      </div>

      {/* New Service Form Modal */}
      <NewServiceForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        vehicles={vehicles}
        onSubmit={(formData) => {
          handleNewServiceSubmit(formData);
          setShowForm(false);
        }}
        loading={loading}
      />
    </div>
  );
}
