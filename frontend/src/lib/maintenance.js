import api from "./api";

export const maintenanceApi = {
  // Get all logs (fuel and maintenance)
  getAllLogs: async () => {
    const response = await api.get("/api/logs");
    return response.data;
  },

  // Get single log by ID
  getLogById: async (id) => {
    const response = await api.get(`/api/logs/${id}`);
    return response.data;
  },

  // Create new log (fuel or maintenance)
  createLog: async (logData) => {
    const response = await api.post("/api/logs", logData);
    return response.data;
  },

  // Update log
  updateLog: async (id, logData) => {
    const response = await api.patch(`/api/logs/${id}`, logData);
    return response.data;
  },

  // Delete log
  deleteLog: async (id) => {
    const response = await api.delete(`/api/logs/${id}`);
    return response.data;
  },

  // Get fuel efficiency analytics
  getFuelEfficiency: async (params) => {
    const response = await api.get("/api/logs/fuel-efficiency", { params });
    return response.data;
  },

  // Backward compatibility aliases
  getAllServiceLogs: async () => {
    return maintenanceApi.getAllLogs();
  },

  getServiceLogById: async (id) => {
    return maintenanceApi.getLogById(id);
  },

  createServiceLog: async (logData) => {
    return maintenanceApi.createLog(logData);
  },

  updateServiceLog: async (id, logData) => {
    return maintenanceApi.updateLog(id, logData);
  },

  deleteServiceLog: async (id) => {
    return maintenanceApi.deleteLog(id);
  },
};
