import api from "./api";

export const analyticsApi = {
  getOverallAnalytics: async (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append("month", month);
    if (year) params.append("year", year);

    const response = await api.get(`/api/analytics/overall${params.toString() ? "?" + params.toString() : ""}`);
    return response.data;
  },

  getTimeSeriesAnalytics: async (timeRange = "month") => {
    const response = await api.get(`/api/analytics/timeseries?timeRange=${timeRange}`);
    return response.data;
  },

  getVehicleAnalytics: async (limit = 5) => {
    const response = await api.get(`/api/analytics/vehicles?limit=${limit}`);
    return response.data;
  },

  getDriverAnalytics: async () => {
    const response = await api.get("/api/analytics/drivers");
    return response.data;
  },

  getFinancialSummary: async () => {
    const response = await api.get("/api/analytics/financial");
    return response.data;
  },

  getVehicleUtilization: async () => {
    const response = await api.get("/api/analytics/utilization");
    return response.data;
  }
};

