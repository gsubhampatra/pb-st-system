"use client";
import { useQuery } from "@tanstack/react-query";
import { api, API_PATHS } from "@/lib/api";

export function usePurchases(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["purchases", params],
    queryFn: async () => {
      const resp = await api.get(API_PATHS.purchases.getAll, { params });
      return resp.data?.data || resp.data || [];
    },
    staleTime: 1000 * 60,
  });
}

export function usePurchase(id: string | null) {
  return useQuery({
    queryKey: ["purchase", id],
    enabled: !!id,
    queryFn: async () => {
      const resp = await api.get(API_PATHS.purchases.getById(id!));
      return resp.data || {};
    },
  });
}

export default usePurchases;
