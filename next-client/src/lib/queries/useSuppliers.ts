"use client";
import { useQuery } from "@tanstack/react-query";
import { api, API_PATHS } from "@/lib/api";

export function useSuppliers(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: async () => {
      const resp = await api.get(API_PATHS.suppliers.getAll, { params });
      return resp.data?.data || resp.data || [];
    },
    staleTime: 1000 * 60, // 1 min
  });
}

export default useSuppliers;
