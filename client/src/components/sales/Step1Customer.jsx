import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import SearchableSelect from '../purchase/ui/SearchableSelect';
import LangInput from '../LangInput';
import { useCustomers } from '../../contexts/CustomerContext';

function Step1Customer({ onCustomerSelect, onGoToNext, currentCustomer }) {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // Use customer context instead of local state
  const { 
    customers: customersData, 
    isLoading: isLoadingCustomers,
    searchTerm,
    setSearchTerm
  } = useCustomers();

  const handleSearchChange = (query) => {
    setSearchTerm(query);
  };

  // --- Create Customer Mutation ---
  const { mutate: createCustomer, isLoading: isCreatingCustomer, error: createError } = useMutation({
    mutationFn: (newCustomer) => api.post(API_PATHS.customers.create, newCustomer),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['customers']); // Invalidate cache to refetch if needed
      onCustomerSelect(data.data); // Automatically select the newly created customer
      setShowCreateForm(false); // Hide form
      setNewCustomerName(''); setNewCustomerPhone(''); setNewCustomerAddress(''); // Clear form
    },
    onError: (error) => {
      console.error("Error creating customer:", error);
      // Handle error display to user
    }
  });

  const handleCreateCustomerSubmit = (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return; // Basic validation
    createCustomer({
      name: newCustomerName,
      phone: newCustomerPhone,
      address: newCustomerAddress
    });
  };

  const handleSelect = (customer) => {
    if (customer) {
      onCustomerSelect(customer);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Step 1: Select Customer</h2>

      {/* --- Customer Selection --- */}
      <SearchableSelect
        label="Search and Select Customer"
        items={customersData || []}
        selected={currentCustomer}
        onSelect={handleSelect}
        onQueryChange={handleSearchChange}
        placeholder="Type to search customers..."
        loading={isLoadingCustomers}
        displayValue={(customer) => customer ? `${customer.name} (${customer.phone || 'No phone'})` : ''}
      />

      {/* --- Option to Create New --- */}
      {!currentCustomer && searchTerm && !isLoadingCustomers && !customersData?.length && (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          Customer not found. Create new?
        </button>
      )}
      {!currentCustomer && !searchTerm && (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          Or Create a New Customer
        </button>
      )}

      {/* --- Create Customer Form (Conditional) --- */}
      {showCreateForm && (
        <form onSubmit={handleCreateCustomerSubmit} className="mt-4 p-4 border rounded-md bg-gray-50 space-y-3">
          <h3 className="font-medium text-gray-700">Create New Customer</h3>
          {createError && <p className="text-red-600 text-sm">Error: {createError.response?.data?.message || createError.message}</p>}
          <div>
            <label htmlFor="newCustomerName" className="block text-sm font-medium text-gray-700">Name *</label>
            <LangInput
              type="text"
              id="newCustomerName"
              value={newCustomerName}
              onChange={setNewCustomerName}
              isRequired={true}
              placeholder="Customer Name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="newCustomerPhone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              id="newCustomerPhone"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="newCustomerAddress" className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              id="newCustomerAddress"
              rows="2"
              value={newCustomerAddress}
              onChange={(e) => setNewCustomerAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingCustomer}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isCreatingCustomer ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        </form>
      )}

      {/* --- Navigation --- */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onGoToNext}
          disabled={!currentCustomer}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Add Items
        </button>
      </div>
    </div>
  );
}

export default Step1Customer;