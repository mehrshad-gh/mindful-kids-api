import axios, { type AxiosInstance } from 'axios';
import { getToken } from '../services/tokenStorage';

const getBaseURL = () => {
  // Expo: EXPO_PUBLIC_* is available at build time
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (url) return url.replace(/\/$/, '');
  return 'https://mindful-kids-api-production.up.railway.app/api';
};

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        // Token invalid/expired – caller or auth context can handle (e.g. logout)
      }
      return Promise.reject(err);
    }
  );

  return client;
}

export const apiClient = createClient();
export { getBaseURL };
