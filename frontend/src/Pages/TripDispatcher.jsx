import { useState, useEffect } from "react";
import { Menu, X, Search, Play, CheckSquare, XSquare, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NewTripForm from "@/components/NewTripForm";
import { tripApi } from "@/lib/trip";
import { vehicleApi } from "@/lib/vehicle";
import { driverApi } from "@/lib/driver";
import { authApi } from "@/lib/auth";

export default function TripDispatcher() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const [tripsRes, vehiclesRes, driversRes, userRes] = await Promise.all([
          tripApi.getAllTrips(),
          vehicleApi.getAllVehicles(),
          driverApi.getAllDrivers(),
          authApi.getUser(),
        ]);
        
        setTrips(tripsRes.data || []);
        setVehicles(vehiclesRes.data || []);
        setDrivers(driversRes.data || []);
        setUser(userRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err?.response?.data?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Check if user can perform an action
  const canCreate = () => {
    return user && ["ADMIN", "DISPATCHER"].includes(user.role);
  };

  const canDispatch = () => {
    return user && ["ADMIN", "FLEET_MANAGER", "DISPATCHER"].includes(user.role);
  };

  const canComplete = () => {
    return user && ["ADMIN", "FLEET_MANAGER", "DISPATCHER"].includes(user.role);
  };

  const canCancel = () => {
    return user && ["ADMIN", "FLEET_MANAGER"].includes(user.role);
  };

  const canDelete = () => {
    return user && ["ADMIN", "FLEET_MANAGER"].includes(user.role);
  };

  // Handle trip dispatch
  const handleDispatch = async (tripId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [tripId]: "dispatch" }));
      await tripApi.dispatchTrip(tripId, 0);
      
      // Refresh trips
      const response = await tripApi.getAllTrips();
      setTrips(response.data || []);
    } catch (err) {
      console.error("Error dispatching trip:", err);
      alert(err?.response?.data?.message || "Failed to dispatch trip");
    } finally {
      setActionLoading((prev) => ({ ...prev, [tripId]: null }));
    }
  };

  // Handle trip completion
  const handleComplete = async (tripId) => {
    const endOdo = prompt("Enter ending odometer reading:");
    if (endOdo === null) return;
    
    const revenue = prompt("Enter revenue (optional):", "0");
    
    try {
      setActionLoading((prev) => ({ ...prev, [tripId]: "complete" }));
      await tripApi.completeTrip(tripId, parseFloat(endOdo), parseFloat(revenue || 0));
      
      // Refresh trips
      const response = await tripApi.getAllTrips();
      setTrips(response.data || []);
    } catch (err) {
      console.error("Error completing trip:", err);
      alert(err?.response?.data?.message || "Failed to complete trip");
    } finally {
      setActionLoading((prev) => ({ ...prev, [tripId]: null }));
    }
  };

  // Handle trip cancellation
  const handleCancel = async (tripId) => {
    if (!confirm("Are you sure you want to cancel this trip?")) return;
    
    try {
      setActionLoading((prev) => ({ ...prev, [tripId]: "cancel" }));
      await tripApi.cancelTrip(tripId);
      
      // Refresh trips
      const response = await tripApi.getAllTrips();
      setTrips(response.data || []);
    } catch (err) {
      console.error("Error cancelling trip:", err);
      alert(err?.response?.data?.message || "Failed to cancel trip");
    } finally {
      setActionLoading((prev) => ({ ...prev, [tripId]: null }));
    }
  };

  // Handle trip deletion
  const handleDelete = async (tripId) => {
    if (!confirm("Are you sure you want to permanently delete this trip?")) return;
    
    try {
      setActionLoading((prev) => ({ ...prev, [tripId]: "delete" }));
      await tripApi.deleteTrip(tripId);
      
      // Refresh trips
      const response = await tripApi.getAllTrips();
      setTrips(response.data || []);
    } catch (err) {
      console.error("Error deleting trip:", err);
      alert(err?.response?.data?.message || "Failed to delete trip");
    } finally {
      setActionLoading((prev) => ({ ...prev, [tripId]: null }));
    }
  };

  // Handle new trip creation
  const handleNewTripSubmit = async (formData) => {
    try {
      await tripApi.createTrip({
        vehicleId: parseInt(formData.vehicleId),
        driverId: parseInt(formData.driverId),
        cargoWeight: parseInt(formData.cargoWeight),
      });
      
      // Refresh trips
      const response = await tripApi.getAllTrips();
      setTrips(response.data || []);
    } catch (err) {
      console.error("Error creating trip:", err);
      throw err;
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-yellow-500/20 text-yellow-400";
      case "Dispatched":
        return "bg-blue-500/20 text-blue-400";
      case "Completed":
        return "bg-green-500/20 text-green-400";
      case "Cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  const filteredTrips = trips
    .filter((t) => {
      const vehicleInfo = vehicles.find(v => v.id === t.vehicleId);
      const driverInfo = drivers.find(d => d.id === t.driverId);
      
      const matchesSearch =
        (vehicleInfo?.licensePlate || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vehicleInfo?.model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (driverInfo?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "id") return a.id - b.id;
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "cargoWeight") return a.cargoWeight - b.cargoWeight;
      return 0;
    });

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
                item.label === "Trip Dispatcher"
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
              <p className="text-slate-400 text-sm mt-1">Trip Dispatcher & Management</p>
              {user && <p className="text-slate-400 text-sm mt-1">Role: {user.role}</p>}
            </div>
            <div className="flex items-center gap-4 flex-1 max-w-md ml-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  type="text"
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1E293B] border-slate-700 text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400">Loading trips...</div>
            </div>
          ) : (
            <>
              {/* Trips Table */}
              <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-700">
                  <div className="flex gap-4">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-[#0F172A] border border-slate-700 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="all">All Status</option>
                      <option value="Draft">Draft</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 rounded-lg bg-[#0F172A] border border-slate-700 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    >
                      <option value="id">Sort by ID</option>
                      <option value="status">Sort by Status</option>
                      <option value="cargoWeight">Sort by Cargo</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                          Trip ID
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                          Vehicle
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                          Driver
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                          Cargo (kg)
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredTrips.length > 0 ? (
                        filteredTrips.map((trip) => {
                          const vehicleInfo = vehicles.find(v => v.id === trip.vehicleId);
                          const driverInfo = drivers.find(d => d.id === trip.driverId);
                          return (
                            <tr key={trip.id} className="hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-amber-400">#{trip.id}</td>
                              <td className="px-6 py-4 text-sm text-slate-300">
                                {vehicleInfo?.licensePlate} - {vehicleInfo?.model}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-300">
                                {driverInfo?.name || "N/A"}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-300">{trip.cargoWeight}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                    trip.status
                                  )}`}
                                >
                                  {trip.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {trip.status === "Draft" && canDispatch() && (
                                    <button
                                      onClick={() => handleDispatch(trip.id)}
                                      disabled={actionLoading[trip.id] !== null}
                                      className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      title="Dispatch trip"
                                    >
                                      <Play size={16} />
                                    </button>
                                  )}
                                  {trip.status === "Dispatched" && canComplete() && (
                                    <button
                                      onClick={() => handleComplete(trip.id)}
                                      disabled={actionLoading[trip.id] !== null}
                                      className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      title="Complete trip"
                                    >
                                      <CheckSquare size={16} />
                                    </button>
                                  )}
                                  {(trip.status === "Draft" || trip.status === "Dispatched") && canCancel() && (
                                    <button
                                      onClick={() => handleCancel(trip.id)}
                                      disabled={actionLoading[trip.id] !== null}
                                      className="p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      title="Cancel trip"
                                    >
                                      <XSquare size={16} />
                                    </button>
                                  )}
                                  {canDelete() && (
                                    <button
                                      onClick={() => handleDelete(trip.id)}
                                      disabled={actionLoading[trip.id] !== null}
                                      className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      title="Delete trip"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                            No trips found. Create one to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* New Trip Form */}
              {canCreate() && (
                <NewTripForm
                  vehicles={vehicles}
                  drivers={drivers}
                  onSubmit={handleNewTripSubmit}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
