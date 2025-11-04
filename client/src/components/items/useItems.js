import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';

export const useItems = () => {
  const {
    data: itemsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.items.getAll);
      return response.data?.items || response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    items: itemsData || [],
    isLoading,
    error,
    refetch,
  };
};
