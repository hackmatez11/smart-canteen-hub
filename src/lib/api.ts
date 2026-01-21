import axios from 'axios';
import { getAuthHeader } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const authHeaders = await getAuthHeader();
    config.headers = {
      ...config.headers,
      ...authHeaders
    };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error codes
      if (error.response.status === 401) {
        // Unauthorized - redirect to login
        console.error('Unauthorized access');
      } else if (error.response.status === 403) {
        console.error('Forbidden access');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
