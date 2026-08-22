import axios from 'axios';

// The API base URL lives in an env variable so it's easy to change between
// local development and production without touching code.
// See .env.example - Vite only exposes variables prefixed with VITE_
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
});

// Attach the saved token (if any) to every outgoing request.
// This runs before each request fires, so login/logout take effect instantly.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the API ever responds "401 unauthorized" (token missing/expired),
// clear the stale token so the app doesn't keep sending a dead one.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
