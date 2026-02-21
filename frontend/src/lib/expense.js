import api from "./api";

export const expenseApi = {
  getAllExpenses: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.vehicleId) params.append("vehicleId", filters.vehicleId);
    if (filters.driverId) params.append("driverId", filters.driverId);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await api.get(`/api/expenses${params.toString() ? "?" + params.toString() : ""}`);
    return response.data;
  },

  getExpenseSummary: async (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);

    const response = await api.get(`/api/expenses/summary${params.toString() ? "?" + params.toString() : ""}`);
    return response.data;
  },

  getVehicleExpenses: async (vehicleId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    const response = await api.get(`/api/expenses/vehicle/${vehicleId}${params.toString() ? "?" + params.toString() : ""}`);
    return response.data;
  },

  getDriverExpenses: async (driverId) => {
    const response = await api.get(`/api/expenses/driver/${driverId}`);
    return response.data;
  }
};
