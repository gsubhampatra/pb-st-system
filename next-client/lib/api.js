import axios from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_BASE_URL = `${BASE}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      error.normalizedMessage = error.response?.data?.message || error.message;
    }
    return Promise.reject(error);
  }
);

export const API_PATHS = {
  items: {
    getAll: '/items',
  },
  customers: {
    getAll: '/customers',
  },
  suppliers: {
    getAll: '/suppliers',
  },
  purchases: {
    getAll: '/purchases',
  },
  sales: {
    getAll: '/sales',
  },
  reports: {
    getSummary: '/reports/summary',
  },
};
