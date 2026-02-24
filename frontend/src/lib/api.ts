import axios from 'axios';

// Base URL configurable por entorno. En dev, el proxy de Vite maneja '/api'.
const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

// Token en memoria y setter para integrarlo con el AuthContext
let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

// Inserta token JWT desde memoria si existe
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${authToken}`,
    };
  }
  return config;
});

// Dejar que el consumidor maneje 401 sin tocar localStorage
api.interceptors.response.use(
  (resp) => resp,
  (err) => Promise.reject(err)
);

export default api;