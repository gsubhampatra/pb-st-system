"use client";
import { useQuery } from "@tanstack/react-query";
import { api, API_PATHS } from "@/lib/api";

export function useAccounts(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["accounts", params],
    queryFn: async () => {
      const resp = await api.get(API_PATHS.accounts.getAll, { params });
      return resp.data?.data || resp.data || [];
    },
    staleTime: 1000 * 60,
  });
}

export default useAccounts;
