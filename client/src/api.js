import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV ? "/api" : "/api",
});

// For production, the API will be on the same domain
// In development, it uses the Vite proxy to localhost:5000

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;