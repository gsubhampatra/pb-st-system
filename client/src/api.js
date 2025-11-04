import axios from "axios";

// Prefer VITE_API_URL with fallback to localhost
const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_BASE_URL = `${BASE}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Basic interceptors for logging; keep response shape unchanged
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optional: attach normalized message
    if (error.response) {
      error.normalizedMessage = error.response?.data?.message || error.message;
    }
    return Promise.reject(error);
  }
);

export const API_PATHS = {
  items: {
    create: `/items`,
    getAll: `/items`,
    getById: (id) => `/items/${id}`,
    update: (id) => `/items/${id}`,
    delete: (id) => `/items/${id}`,
  },
  suppliers: {
    create: `/suppliers`,
    getAll: `/suppliers`, // Search/filter via query params
    getById: (id) => `/suppliers/${id}`,
    update: (id) => `/suppliers/${id}`,
    delete: (id) => `/suppliers/${id}`,
  },
  customers: {
    create: `/customers`,
    getAll: `/customers`, // Search/filter via query params
    getById: (id) => `/customers/${id}`,
    update: (id) => `/customers/${id}`,
    delete: (id) => `/customers/${id}`,
    getCustomerCredit: (id) => `/customers/${id}/credit`, // Filter via query params
  },
  purchases: {
    create: `/purchases`,
    getAll: `/purchases`, // Filter via query params
    getById: (id) => `/purchases/${id}`,
    update: (id) => `/purchases/${id}`, // Update status/paidAmount
    delete: (id) => `/purchases/${id}`,
  },
  sales: {
    create: `/sales`,
    getAll: `/sales`, // Filter via query params
    getById: (id) => `/sales/${id}`,
    update: (id) => `/sales/${id}`, // Update status/paidAmount
    delete: (id) => `/sales/${id}`,
  },
  receipts: {
    create: `/receipts`,
    getAll: `/receipts`, // Filter via query params
    getById: (id) => `/receipts/${id}`,
    update: (id) => `/receipts/${id}`, // Update status/paidAmount
    delete: (id) => `/receipts/${id}`,
  },
  payments: {
    create: `/payments`,
    getAll: `/payments`, // Filter via query params
    getById: (id) => `/payments/${id}`,
    update: (id) => `/payments/${id}`, // Update status/paidAmount
    delete: (id) => `/payments/${id}`,
  },
  accounts: {
    create: `/accounts`,
    getAll: `/accounts`, // Search/filter via query params
    getById: (id) => `/accounts/${id}`,
    update: (id) => `/accounts/${id}`,
    delete: (id) => `/accounts/${id}`,
    getAccountPayments: (id) => `/accounts/${id}/payments`, // Filter via query params
    getAccountReceipts: (id) => `/accounts/${id}/receipts`, // Filter via query params
  },
  reports: {
    download: `/reports/download`,
    getDownloadHistory: "/reports/history",
    getSummary: "/reports/summary",
  },
  print: {
    printInvoice: `/print/purchase`,
  },
  database: {
    stats: `/database/stats`,
    clear: `/database/clear`,
    reset: `/database/reset`,
  },
};

// Example function to add query parameters (optional helper)
export const addQueryParams = (url, params) => {
  const urlObj = new URL(url, window.location.origin); // Base URL needed for URL constructor
  Object.keys(params).forEach((key) => {
    if (
      params[key] !== undefined &&
      params[key] !== null &&
      params[key] !== ""
    ) {
      urlObj.searchParams.append(key, params[key]);
    }
  });
  // Return only the path and search params, relative to the base URL defined above
  return urlObj.pathname + urlObj.search;
};
