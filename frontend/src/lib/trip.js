import api from "./api";

export const tripApi = {
  /**
   * Create a new trip in Draft status
   * @param {Object} tripData - { vehicleId, driverId, cargoWeight }
   */
  createTrip: async (tripData) => {
    const response = await api.post("/api/trips", tripData);
    return response.data;
  },

  /**
   * Get all trips with optional filtering
   * @param {Object} filters - { status, vehicleId, driverId }
   */
  getAllTrips: async (filters = {}) => {
    const response = await api.get("/api/trips", { params: filters });
    return response.data;
  },

  /**
   * Get a specific trip by ID
   */
  getTripById: async (id) => {
    const response = await api.get(`/api/trips/${id}`);
    return response.data;
  },

  /**
   * Update trip details (only Draft trips)
   */
  updateTrip: async (id, tripData) => {
    const response = await api.patch(`/api/trips/${id}`, tripData);
    return response.data;
  },

  /**
   * Dispatch a trip (Draft → Dispatched)
   * Updates vehicle and driver status to On Trip/On Duty
   */
  dispatchTrip: async (id, startOdo) => {
    const response = await api.patch(`/api/trips/${id}/dispatch`, { startOdo });
    return response.data;
  },

  /**
   * Complete a trip (Dispatched → Completed)
   * Updates vehicle and driver status back to Available/Off Duty
   */
  completeTrip: async (id, endOdo, revenue = 0) => {
    const response = await api.patch(`/api/trips/${id}/complete`, { endOdo, revenue });
    return response.data;
  },

  /**
   * Cancel a trip (Draft or Dispatched only)
   */
  cancelTrip: async (id) => {
    const response = await api.patch(`/api/trips/${id}/cancel`);
    return response.data;
  },

  /**
   * Delete a trip (ADMIN and FLEET_MANAGER only)
   */
  deleteTrip: async (id) => {
    const response = await api.delete(`/api/trips/${id}`);
    return response.data;
  }
};
