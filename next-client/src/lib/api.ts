
// lib/api.ts
import axios from "axios";


const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ✅ Define API Paths with type safety
type IdParam = string | number;

export const API_PATHS = {
  items: {
    create: `/items`,
    getAll: `/items`,
    getById: (id: IdParam) => `/items/${id}`,
    update: (id: IdParam) => `/items/${id}`,
    delete: (id: IdParam) => `/items/${id}`,
  },
  suppliers: {
    create: `/suppliers`,
    getAll: `/suppliers`,
    getById: (id: IdParam) => `/suppliers/${id}`,
    update: (id: IdParam) => `/suppliers/${id}`,
    delete: (id: IdParam) => `/suppliers/${id}`,
  },
  customers: {
    create: `/customers`,
    getAll: `/customers`,
    getById: (id: IdParam) => `/customers/${id}`,
    update: (id: IdParam) => `/customers/${id}`,
    delete: (id: IdParam) => `/customers/${id}`,
    getCustomerCredit: (id: IdParam) => `/customers/${id}/credit`,
  },
  purchases: {
    create: `/purchases`,
    getAll: `/purchases`,
    getById: (id: IdParam) => `/purchases/${id}`,
    update: (id: IdParam) => `/purchases/${id}`,
    delete: (id: IdParam) => `/purchases/${id}`,
  },
  sales: {
    create: `/sales`,
    getAll: `/sales`,
    getById: (id: IdParam) => `/sales/${id}`,
    update: (id: IdParam) => `/sales/${id}`,
    delete: (id: IdParam) => `/sales/${id}`,
  },
  receipts: {
    create: `/receipts`,
    getAll: `/receipts`,
    getById: (id: IdParam) => `/receipts/${id}`,
    update: (id: IdParam) => `/receipts/${id}`,
    delete: (id: IdParam) => `/receipts/${id}`,
  },
  payments: {
    create: `/payments`,
    getAll: `/payments`,
    getById: (id: IdParam) => `/payments/${id}`,
    update: (id: IdParam) => `/payments/${id}`,
    delete: (id: IdParam) => `/payments/${id}`,
  },
  accounts: {
    create: `/accounts`,
    getAll: `/accounts`,
    getById: (id: IdParam) => `/accounts/${id}`,
    update: (id: IdParam) => `/accounts/${id}`,
    delete: (id: IdParam) => `/accounts/${id}`,
    getAccountPayments: (id: IdParam) => `/accounts/${id}/payments`,
    getAccountReceipts: (id: IdParam) => `/accounts/${id}/receipts`,
  },
  reports: {
    download: `/reports/download`,
    getDownloadHistory: "/reports/history",
    getSummary: "/reports/summary",
  },
  print: {
    printInvoice: `/print/purchase`,
  },
};

// ✅ Helper function to add query params (typed)
export function addQueryParams<T extends Record<string, string | number | undefined | null>>(
  url: string,
  params: T
): string {
  const urlObj = new URL(url, API_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      urlObj.searchParams.append(key, String(value));
    }
  });
  return urlObj.pathname + urlObj.search;
}

