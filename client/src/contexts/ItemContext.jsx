import { createContext, useState, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../api';

// Create the context
const ItemContext = createContext();

// Create a provider component
export function ItemProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch items with search functionality
  const { 
    data: items = [], 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['items', searchTerm],
    queryFn: async () => {
      const response = await api.get(API_PATHS.items.getAll, {
        params: { search: searchTerm }
      });
      return response.data?.items || response.data || [];
    }
  });

  // Reset selected item when search term changes
  useEffect(() => {
    if (searchTerm) {
      setSelectedItem(null);
    }
  }, [searchTerm]);

  // Clear the selected item
  const clearSelectedItem = () => {
    setSelectedItem(null);
  };

  // Value to be provided to consumers
  const value = {
    items,
    isLoading,
    isError,
    error,
    searchTerm,
    setSearchTerm,
    selectedItem,
    setSelectedItem,
    clearSelectedItem,
    refetch
  };

  return (
    <ItemContext.Provider value={value}>
      {children}
    </ItemContext.Provider>
  );
}

// Custom hook to use the item context
export function useItems() {
  const context = useContext(ItemContext);
  if (context === undefined) {
    throw new Error('useItems must be used within an ItemProvider');
  }
  return context;
}