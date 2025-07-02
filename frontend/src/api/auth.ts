import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore'; // adjust the path as needed

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 1. Axios Instance
const API = axios.create({
  baseURL: `${API_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Auth API functions
export const registerUser = (data: { email: string; password: string; username: string; role?: string }) => 
  API.post('/register', data);
export const loginUser = (data: { email: string; password: string }) => 
  API.post('/login', data);
export const refreshTokenRequest = (refreshToken: string) =>
  API.post('/refresh', { refreshToken });

// 3. 🔁 Axios Interceptor Code — place HERE after API instance is defined
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const authStore = useAuthStore.getState();
      const refreshToken = authStore.refreshToken;

      if (!refreshToken) throw new Error('No refresh token available');

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(axios(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      const res = await refreshTokenRequest(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = res.data;

      authStore.login({
        userId: authStore.user?.userId || '',
        email: authStore.user?.email || '',
        username: authStore.user?.username || '',
        role: authStore.user?.role || '',
        accessToken,
        refreshToken: newRefreshToken,
      });

      originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
      processQueue(null, accessToken);
      return axios(originalRequest);
    } catch (err) {
      processQueue(err, null);
      const authStore = useAuthStore.getState(); // pulls the state AND methods
      authStore.logout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

// 4. Default export of API (optional)
export default API;
