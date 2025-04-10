import { createContext, useState, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../api';

// Create the context
const CustomerContext = createContext();

// Create a provider component
export function CustomerProvider({ children }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch customers with search functionality
  const { 
    data: customers = [], 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      const response = await api.get(API_PATHS.customers.getAll, {
        params: { search: searchTerm }
      });
      return response.data;
    }
  });

  // Reset selected customer when search term changes
  useEffect(() => {
    if (searchTerm) {
      setSelectedCustomer(null);
    }
  }, [searchTerm]);

  // Clear the selected customer
  const clearSelectedCustomer = () => {
    setSelectedCustomer(null);
  };

  // Get customer credit balance
  const fetchCustomerCredit = async (customerId) => {
    try {
      const response = await api.get(API_PATHS.customers.getCustomerCredit(customerId));
      return response.data;
    } catch (error) {
      console.error('Error fetching customer credit:', error);
      throw error;
    }
  };

  // Value to be provided to consumers
  const value = {
    customers,
    isLoading,
    isError,
    error,
    searchTerm,
    setSearchTerm,
    selectedCustomer,
    setSelectedCustomer,
    clearSelectedCustomer,
    fetchCustomerCredit,
    refetch
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
}

// Custom hook to use the customer context
export function useCustomers() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
}