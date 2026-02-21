import api from "./api";

// Helper function to convert MM/YY format to ISO date string
const convertExpiryToDate = (expiryDate) => {
  if (!expiryDate) return null;
  
  try {
    const parts = expiryDate.split('/');
    if (parts.length < 2) return null;
    
    let month = parseInt(parts[0]);
    let year = parseInt(parts[parts.length - 1]);
    
    if (isNaN(month) || isNaN(year)) return null;
    
    // Convert 2-digit year to 4-digit year (00-99 -> 2000-2099)
    if (year < 100) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }
    
    // Use the last day of the expiry month
    const lastDay = new Date(year, month, 0);
    return lastDay.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  } catch (e) {
    console.error('Error converting expiry date:', e);
    return null;
  }
};

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
    // Transform frontend data to backend format
    const transformedData = {
      name: driverData.name,
      licenseExpiry: convertExpiryToDate(driverData.expiryDate),
      status: driverData.status || "Off Duty"
    };
    
    if (!transformedData.licenseExpiry) {
      throw new Error('Invalid license expiry date format. Please use MM/YY format (e.g., 01/26)');
    }
    
    try {
      const response = await api.post("/api/drivers", transformedData);
      return response.data;
    } catch (error) {
      console.error('Create driver error:', error.response?.data || error.message);
      throw error;
    }
  },

  updateDriver: async (id, driverData) => {
    // Transform frontend data to backend format
    const transformedData = {
      name: driverData.name,
      status: driverData.status || "Off Duty"
    };
    
    // Only include licenseExpiry if it's provided and valid
    if (driverData.expiryDate) {
      transformedData.licenseExpiry = convertExpiryToDate(driverData.expiryDate);
      if (!transformedData.licenseExpiry) {
        throw new Error('Invalid license expiry date format. Please use MM/YY format (e.g., 01/26)');
      }
    }
    
    try {
      const response = await api.patch(`/api/drivers/${id}`, transformedData);
      return response.data;
    } catch (error) {
      console.error('Update driver error:', error.response?.data || error.message);
      throw error;
    }
  },

  deleteDriver: async (id) => {
    const response = await api.delete(`/api/drivers/${id}`);
    return response.data;
  }
};
