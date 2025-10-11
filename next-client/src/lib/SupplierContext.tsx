import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from './api';

// Minimal supplier shape; extend as needed
export interface Supplier {
  id: number | string;
  name?: string;
  [key: string]: any;
}

interface SupplierContextType {
  suppliers: Supplier[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectedSupplier: Supplier | null;
  setSelectedSupplier: (s: Supplier | null) => void;
  clearSelectedSupplier: () => void;
  refetch: () => Promise<unknown> | void;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

interface SupplierProviderProps {
  children: ReactNode;
}

export function SupplierProvider({ children }: SupplierProviderProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const {
    data: suppliers = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Supplier[], unknown>({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      const response = await api.get(API_PATHS.suppliers.getAll, {
        params: { search: searchTerm },
      });
      return response.data;
    },
  });

  useEffect(() => {
    if (searchTerm) setSelectedSupplier(null);
  }, [searchTerm]);

  const clearSelectedSupplier = () => setSelectedSupplier(null);

  const value: SupplierContextType = {
    suppliers,
    isLoading,
    isError,
    error,
    searchTerm,
    setSearchTerm,
    selectedSupplier,
    setSelectedSupplier,
    clearSelectedSupplier,
    refetch,
  };

  return <SupplierContext.Provider value={value}>{children}</SupplierContext.Provider>;
}

export function useSuppliers() {
  const context = useContext(SupplierContext);
  if (context === undefined) throw new Error('useSuppliers must be used within a SupplierProvider');
  return context;
}

export default SupplierContext;