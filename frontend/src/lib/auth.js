import api from "./api";

export const authApi = {
  register: async (userData) => {
    const response = await api.post("/api/auth/register", userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/api/auth/login", credentials);
    return response.data; // cookies are set automatically
  },

  logout: async () => {
    await api.post("/api/auth/logout"); // server clears cookies
  },

  getUser: async () => {
    const response = await api.get("/api/auth/profile");
    return response.data;
  },

  refreshToken: async () => {
    // You usually don’t need this manually — interceptor handles it
    const response = await api.post("/api/auth/refresh-access-token");
    return response.data;
  }
};