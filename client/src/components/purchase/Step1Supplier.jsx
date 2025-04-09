// src/components/purchase/Step1Supplier.jsx
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
// Adjust path if needed
import SearchableSelect from './ui/SearchableSelect';
import debounce from 'lodash.debounce';
import LangInput from '../LangInput'; // Adjust path if needed
function Step1Supplier({ onSupplierSelect, onGoToNext, currentSupplier }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // Debounce the search term update
  const debouncedSetSearchTerm = useCallback(
    debounce((value) => setSearchTerm(value), 300), // 300ms delay
    []
  );

  const handleSearchChange = (query) => {
    debouncedSetSearchTerm(query);
  };

  // --- Fetch Suppliers ---
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      const response = await api.get(API_PATHS.suppliers.getAll, {
        params: { search: searchTerm },
      });
      return response.data; // Expects an array of suppliers [{id, name, ...}]
    },
    enabled: !!searchTerm, // Only run query when searchTerm is not empty
    placeholderData: [], // Start with empty array
  });

  // --- Create Supplier Mutation ---
  const { mutate: createSupplier, isLoading: isCreatingSupplier, error: createError } = useMutation({
    mutationFn: (newSupplier) => api.post(API_PATHS.suppliers.create, newSupplier),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['suppliers']); // Invalidate cache to refetch if needed
      onSupplierSelect(data); // Automatically select the newly created supplier
      setShowCreateForm(false); // Hide form
      setNewSupplierName(''); setNewSupplierPhone(''); setNewSupplierAddress(''); // Clear form
      // Optionally go to next step automatically
      // onGoToNext();
    },
    onError: (error) => {
        console.error("Error creating supplier:", error);
        // Handle error display to user
    }
  });

  const handleCreateSupplierSubmit = (e) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return; // Basic validation
    createSupplier({
        name: newSupplierName,
        phone: newSupplierPhone,
        address: newSupplierAddress
    });
  };

  const handleSelect = (supplier) => {
    if (supplier) {
        onSupplierSelect(supplier);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Step 1: Select Supplier</h2>

      {/* --- Supplier Selection --- */}
      <SearchableSelect
        label="Search and Select Supplier"
        items={suppliersData || []}
        selected={currentSupplier}
        onSelect={handleSelect}
        onQueryChange={handleSearchChange}
        placeholder="Type to search suppliers..."
        loading={isLoadingSuppliers}
        displayValue={(supplier) => supplier ? `${supplier.name} (${supplier.phone || 'No phone'})` : ''}
      />

       {/* --- Option to Create New --- */}
       {!currentSupplier && searchTerm && !isLoadingSuppliers && !suppliersData?.length && (
            <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
                Supplier not found. Create new?
            </button>
       )}
       {!currentSupplier && !searchTerm && (
         <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
          >
            Or Create a New Supplier
         </button>
       )}


      {/* --- Create Supplier Form (Conditional) --- */}
      {showCreateForm && (
        <form onSubmit={handleCreateSupplierSubmit} className="mt-4 p-4 border rounded-md bg-gray-50 space-y-3">
          <h3 className="font-medium text-gray-700">Create New Supplier</h3>
          {createError && <p className="text-red-600 text-sm">Error: {createError.response?.data?.message || createError.message}</p>}
          <div>
            <label htmlFor="newSupplierName" className="block text-sm font-medium text-gray-700">Name *</label>
            <LangInput
              type="text"
              id="newSupplierName"
              value={newSupplierName}
              onChange={ setNewSupplierName}
              isRequired={true}
              placeholder="Supplier Name"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="newSupplierPhone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              id="newSupplierPhone"
              value={newSupplierPhone}
              onChange={(e) => setNewSupplierPhone(e.target.value)}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
           <div>
            <label htmlFor="newSupplierAddress" className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              id="newSupplierAddress"
              rows="2"
              value={newSupplierAddress}
              onChange={(e) => setNewSupplierAddress(e.target.value)}
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
              disabled={isCreatingSupplier}
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isCreatingSupplier ? 'Creating...' : 'Create & Select'}
            </button>
          </div>
        </form>
      )}

        {/* --- Navigation --- */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onGoToNext}
          disabled={!currentSupplier}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Add Items
        </button>
      </div>
    </div>
  );
}

export default Step1Supplier;