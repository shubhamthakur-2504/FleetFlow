import axios from "axios";

// Main API client with interceptors
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 120000,
    withCredentials: true,
});

// Plain Axios instance with NO interceptors
const plainAxios = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 120000,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, response = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(response);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;

        // Prevent retrying refresh request
        const isRefreshRequest = originalRequest.url?.includes("/api/auth/refresh-access-token");

        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch(err => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                // Use plainAxios to avoid interceptor recursion
                await plainAxios.post("/api/auth/refresh-access-token");

                processQueue(null);
                return api(originalRequest); // Retry original request
            } catch (refreshError) {
                console.log("inside catch to redirect to auth");

                processQueue(refreshError, null);
                if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
                    window.location.href = "/login";
                } // Redirect to login
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;