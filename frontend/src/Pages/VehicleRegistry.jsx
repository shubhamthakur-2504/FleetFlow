import { useState, useEffect } from "react";
import { Menu, X, Search, Plus, Loader } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NewVehicleForm from "@/components/NewVehicleForm";
import { vehicleApi } from "@/lib/vehicle.js";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { authApi } from "@/lib/auth";

export default function VehicleRegistry() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("licensePlate");
  const [filterStatus, setFilterStatus] = useState("all");
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Fetch user info and vehicles on component mount
  useEffect(() => {
    fetchUser();
    fetchVehicles();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authApi.getUser();
      setUser(response.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    } finally {
      setUserLoading(false);
    }
  };

  // Helper function to check if user can perform action
  const canCreate = () => ["ADMIN", "FLEET_MANAGER"].includes(user?.role);
  const canUpdate = () => ["ADMIN", "FLEET_MANAGER"].includes(user?.role);
  const canRetire = () => ["ADMIN", "FLEET_MANAGER"].includes(user?.role);
  const canDelete = () => ["ADMIN", "FLEET_MANAGER"].includes(user?.role);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = filterStatus !== "all" ? { status: filterStatus } : {};
      const response = await vehicleApi.getAllVehicles(filters);
      setVehicles(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load vehicles");
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
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
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-500/20 text-green-400";
      case "in_maintenance":
      case "maintenance":
        return "bg-yellow-500/20 text-yellow-400";
      case "on_trip":
        return "bg-blue-500/20 text-blue-400";
      case "out_of_service":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-slate-600/20 text-slate-400";
    }
  };

  const formatStatusDisplay = (status) => {
    if (!status) return "-";
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatFieldValue = (value) => {
    if (typeof value === 'number' && !Number.isInteger(value)) {
      return value.toFixed(2);
    }
    return value || "-";
  };

  const filteredVehicles = vehicles
    .filter((v) => {
      // Don't show retired vehicles unless explicly filtering for them
      if (v.isRetired && filterStatus === "all") return false;
      
      const matchesSearch =
        (v.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.model?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.type?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === "all" || 
        v.status?.toLowerCase().replace(" ", "_") === filterStatus.toLowerCase();
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "licensePlate") return (a.licensePlate || "").localeCompare(b.licensePlate || "");
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      if (sortBy === "odometer") return (a.odometer || 0) - (b.odometer || 0);
      return 0;
    });

  const handleNewVehicleSubmit = async (formData) => {
    try {
      setActionLoading("creating");
      const createPayload = {
        licensePlate: formData.licensePlate,
        model: formData.model,
        type: formData.type, 
        maxLoad: parseFloat(formData.maxLoad),
        acquisitionCost: formData.acquisitionCost ? parseFloat(formData.acquisitionCost) : 0,
      };
      await vehicleApi.createVehicle(createPayload);
      setShowNewVehicleForm(false);
      await fetchVehicles();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create vehicle");
      console.error("Error creating vehicle:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      try {
        setActionLoading(`delete-${id}`);
        await vehicleApi.deleteVehicle(id);
        await fetchVehicles();
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to delete vehicle");
        console.error("Error deleting vehicle:", err);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleRetireVehicle = async (id) => {
    try {
      setActionLoading(`retire-${id}`);
      await vehicleApi.toggleRetirement(id);
      await fetchVehicles();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to retire vehicle");
      console.error("Error retiring vehicle:", err);
    } finally {
      setActionLoading(null);
    }
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
                item.label === "Vehicle Registry"
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
              <p className="text-slate-400 text-sm mt-1">Vehicle Registry</p>
              {user && <p className="text-xs text-slate-500 mt-1">Role: {user.role}</p>}
            </div>
            {canCreate() ? (
              <Button
                onClick={() => setShowNewVehicleForm(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold flex items-center gap-2"
              >
                <Plus size={18} />
                New Vehicle
              </Button>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-slate-700/50 text-slate-400 text-sm flex items-center gap-2">
                <Plus size={18} />
                Create disabled
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search and Filter Bar */}
          <div className="mb-6 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400">
                {error}
              </div>
            )}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  type="text"
                  placeholder="Search by license plate, model, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1E293B] border-slate-700 text-slate-100"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#1E293B] border border-slate-700 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              >
                <option value="all">All Status</option>
                {VEHICLE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[#1E293B] border border-slate-700 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              >
                <option value="licensePlate">Sort by Plate</option>
                <option value="status">Sort by Status</option>
                <option value="odometer">Sort by Odometer</option>
              </select>
            </div>
          </div>

          {/* Vehicles Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={32} className="text-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="bg-[#1E293B] border border-slate-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                        License Plate
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                        Model
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-amber-400">
                        Max Load
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
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map((vehicle) => (
                        <tr key={vehicle.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-semibold text-amber-400">
                            {vehicle.licensePlate}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">{vehicle.model}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{vehicle.type}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {formatFieldValue(vehicle.maxLoad)} kg
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                vehicle.status
                              )}`}
                            >
                              {formatStatusDisplay(vehicle.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              {canRetire() ? (
                                <>
                                  <button
                                    onClick={() => handleRetireVehicle(vehicle.id)}
                                    disabled={actionLoading === `retire-${vehicle.id}`}
                                    className="text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors text-xs"
                                    title="Only ADMIN and FLEET_MANAGER can retire vehicles"
                                  >
                                    {actionLoading === `retire-${vehicle.id}` ? (
                                      <Loader size={14} className="inline animate-spin" />
                                    ) : (
                                      vehicle.isRetired ? "Reactivate" : "Retire"
                                    )}
                                  </button>
                                  {canDelete() && <span className="text-slate-600">•</span>}
                                </>
                              ) : null}
                              {canDelete() ? (
                                <button
                                  onClick={() => handleDeleteVehicle(vehicle.id)}
                                  disabled={actionLoading === `delete-${vehicle.id}`}
                                  className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors text-xs"
                                  title="Only ADMIN and FLEET_MANAGER can delete vehicles"
                                >
                                  {actionLoading === `delete-${vehicle.id}` ? (
                                    <Loader size={14} className="inline animate-spin" />
                                  ) : (
                                    "Delete"
                                  )}
                                </button>
                              ) : null}
                              {!canRetire() && !canDelete() && (
                                <span className="text-slate-500 text-xs">No actions available</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-400">
                          No vehicles found. Create one to get started!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Vehicle Form Modal */}
      <NewVehicleForm
        isOpen={showNewVehicleForm}
        onClose={() => setShowNewVehicleForm(false)}
        onSubmit={handleNewVehicleSubmit}
      />
    </div>
  );
}
