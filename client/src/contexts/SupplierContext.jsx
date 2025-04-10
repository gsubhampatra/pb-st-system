import { createContext, useState, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../api';

// Create the context
const SupplierContext = createContext();

// Create a provider component
export function SupplierProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Fetch suppliers with search functionality
  const { 
    data: suppliers = [], 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      const response = await api.get(API_PATHS.suppliers.getAll, {
        params: { search: searchTerm }
      });
      return response.data;
    }
  });

  // Reset selected supplier when search term changes
  useEffect(() => {
    if (searchTerm) {
      setSelectedSupplier(null);
    }
  }, [searchTerm]);

  // Clear the selected supplier
  const clearSelectedSupplier = () => {
    setSelectedSupplier(null);
  };

  // Value to be provided to consumers
  const value = {
    suppliers,
    isLoading,
    isError,
    error,
    searchTerm,
    setSearchTerm,
    selectedSupplier,
    setSelectedSupplier,
    clearSelectedSupplier,
    refetch
  };

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
}

// Custom hook to use the supplier context
export function useSuppliers() {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSuppliers must be used within a SupplierProvider');
  }
  return context;
}