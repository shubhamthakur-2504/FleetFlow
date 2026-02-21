import api from "./api";

export const vehicleApi = {
  getAllVehicles: async (filters = {}) => {
    const response = await api.get("/api/vehicles", { params: filters });
    return response.data;
  },

  getVehicleById: async (id) => {
    const response = await api.get(`/api/vehicles/${id}`);
    return response.data;
  },

  createVehicle: async (vehicleData) => {
    const response = await api.post("/api/vehicles", vehicleData);
    return response.data;
  },

  updateVehicle: async (id, vehicleData) => {
    const response = await api.patch(`/api/vehicles/${id}`, vehicleData);
    return response.data;
  },

  deleteVehicle: async (id) => {
    const response = await api.delete(`/api/vehicles/${id}`);
    return response.data;
  },

  toggleRetirement: async (id) => {
    const response = await api.patch(`/api/vehicles/${id}/retire`);
    return response.data;
  },
};
