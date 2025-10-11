"use client";
import { useQuery } from "@tanstack/react-query";
import { api, API_PATHS } from "@/lib/api";

export function useItems(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ["items", params],
    queryFn: async () => {
      const resp = await api.get(API_PATHS.items.getAll, { params });
      return resp.data?.data || resp.data || [];
    },
    staleTime: 1000 * 60,
  });
}

export function useItemSearch(q: string) {
  return useQuery({
    queryKey: ["items-search", q],
    enabled: !!q && q.length > 0,
    queryFn: async () => {
      const resp = await api.get(API_PATHS.items.getAll, { params: { search: q } });
      return resp.data?.data || resp.data || [];
    },
    staleTime: 1000 * 30,
  });
}

export default useItems;
