import api from "./api";

export const driverApi = {
  getAllDrivers: async () => {
    const response = await api.get("/api/drivers");
    return response.data;
  },

  getDriverById: async (id) => {
    const response = await api.get(`/api/drivers/${id}`);
    return response.data;
  },

  createDriver: async (driverData) => {
    const response = await api.post("/api/drivers", driverData);
    return response.data;
  },

  updateDriver: async (id, driverData) => {
    const response = await api.put(`/api/drivers/${id}`, driverData);
    return response.data;
  },

  updateDriverStatus: async (id, status) => {
    const response = await api.patch(`/api/drivers/${id}/status`, { status });
    return response.data;
  },

  deleteDriver: async (id) => {
    const response = await api.delete(`/api/drivers/${id}`);
    return response.data;
  },

  searchDrivers: async (params) => {
    const response = await api.get("/api/drivers/search", { params });
    return response.data;
  },

  getDriverRating: async (id) => {
    const response = await api.get(`/api/drivers/${id}/rating`);
    return response.data;
  },
};
