import axios from 'axios';

const api = axios.create({ withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getErrorMessage = (error, fallback) =>
  error.response?.data?.error ||
  error.response?.data?.message ||
  (error.request ? 'The server could not be reached. Check that the backend is running.' : error.message) ||
  fallback;

export default api;
