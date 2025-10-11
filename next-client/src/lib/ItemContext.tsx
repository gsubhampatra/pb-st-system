import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from './api';

// Minimal item shape; extend as needed
export interface Item {
  id: number | string;
  name?: string;
  [key: string]: any;
}

// Context value shape
interface ItemContextType {
  items: Item[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  selectedItem: Item | null;
  setSelectedItem: (item: Item | null) => void;
  clearSelectedItem: () => void;
  refetch: () => Promise<unknown> | void;
}

// Create the context
const ItemContext = createContext<ItemContextType | undefined>(undefined);

// Provider props
interface ItemProviderProps {
  children: ReactNode;
}

export function ItemProvider({ children }: ItemProviderProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Fetch items with search functionality
  const { 
    data: items = [], 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery<Item[], unknown>({
    queryKey: ['items', searchTerm],
    queryFn: async () => {
      const response = await api.get(API_PATHS.items.getAll, {
        params: { search: searchTerm }
      });
      return response.data;
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
  const value: ItemContextType = {
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

export default ItemContext;
