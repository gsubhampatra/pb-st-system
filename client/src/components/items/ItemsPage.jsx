import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaEdit, FaTrashAlt, FaPlusCircle } from 'react-icons/fa'; // Example icons
import { API_PATHS, api } from '../../api';
import LangInput from '../LangInput';

function ItemsPage() {
  const queryClient = useQueryClient();

  // --- State for the form ---
  const [editItemId, setEditItemId] = useState(null); // null for create, ID for edit
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [formError, setFormError] = useState('');

  // --- Fetch Items Query ---
  const {
    data: itemsData,
    isLoading: isLoadingItems,
    error: itemsError,
    refetch: refetchItems, // Function to manually refetch
  } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.items.getAll);
      return response.data; // Expects an array of items
    },
    staleTime: 1000 * 60 * 2, // Optional: Data is fresh for 2 minutes
  });

  // --- Reset Form ---
  const resetForm = () => {
    setEditItemId(null);
    setName('');
    setDescription('');
    setUnit('');
    setBasePrice('');
    setCurrentStock('');
    setFormError('');
  };

  // --- Handle Edit Click ---
  const handleEdit = (item) => {
    setEditItemId(item.id);
    setName(item.name);
    setDescription(item.description || ''); // Handle null description
    setUnit(item.unit);
    setBasePrice(String(item.basePrice)); // Form inputs expect strings
    setCurrentStock(String(item.currentStock));
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  };

  // --- Create Item Mutation ---
  const { mutate: createItem, isLoading: isCreating } = useMutation({
    mutationFn: (newItemData) =>
      api.post(API_PATHS.items.create, newItemData),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']); // Refetch list after creation
      resetForm();
      alert('Item created successfully!'); // Replace with toast notification ideally
    },
    onError: (error) => {
      console.error('Error creating item:', error);
      setFormError(
        error.response?.data?.message || 'Failed to create item. Please try again.'
      );
      alert(`Error: ${error.response?.data?.message || 'Failed to create item'}`); // Replace with toast
    },
  });

  // --- Update Item Mutation ---
  const { mutate: updateItem, isLoading: isUpdating } = useMutation({
    mutationFn: (itemData) => // itemData should include id
      api.put(API_PATHS.items.update(itemData.id), itemData),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']); // Refetch list after update
      resetForm();
      alert('Item updated successfully!'); // Replace with toast
    },
    onError: (error) => {
      console.error('Error updating item:', error);
      setFormError(
        error.response?.data?.message || 'Failed to update item. Please try again.'
      );
      alert(`Error: ${error.response?.data?.message || 'Failed to update item'}`); // Replace with toast
    },
  });

  // --- Delete Item Mutation ---
  const { mutate: deleteItem, isLoading: isDeleting } = useMutation({
    mutationFn: (itemId) => api.delete(API_PATHS.items.delete(itemId)),
    onSuccess: (_, itemId) => { // Pass itemId to onSuccess if needed
      queryClient.invalidateQueries(['items']); // Refetch list
      alert('Item deleted successfully!'); // Replace with toast
      // If the deleted item was being edited, reset the form
      if (editItemId === itemId) {
        resetForm();
      }
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to delete item'}`); // Replace with toast
    },
  });

  // --- Handle Form Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError(''); // Clear previous errors

    // Basic Validation
    if (!name || !unit || !basePrice || !currentStock) {
      setFormError('Please fill in all required fields (Name, Unit, Base Price, Stock).');
      return;
    }
    const priceNum = parseFloat(basePrice);
    const stockNum = parseInt(currentStock, 10);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid non-negative Base Price.');
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Please enter a valid non-negative Current Stock.');
      return;
    }


    const itemData = {
      name: name.trim(),
      description: description.trim() || null, // Send null if empty
      unit: unit.trim(),
      basePrice: priceNum,
      currentStock: stockNum,
    };

    if (editItemId) {
      // Update existing item
      updateItem({ ...itemData, id: editItemId });
    } else {
      // Create new item
      createItem(itemData);
    }
  };

  // --- Handle Delete Click ---
  const handleDelete = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      deleteItem(itemId);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Manage Items</h1>

      {/* --- Create/Edit Form --- */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          {editItemId ? 'Edit Item' : 'Create New Item'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
              <LangInput
                type="text"
                id="name"
                value={name}
                onChange={setName}
                isRequired={true}
                placeholder='e.g., '
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* Unit */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit *</label>
              <input
                type="text"
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                placeholder='e.g., pcs, kg, box'
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* Base Price */}
            <div>
              <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">Base Price *</label>
              <input
                type="number"
                id="basePrice"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            {/* Current Stock */}
            <div>
              <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700">Current Stock *</label>
              <input
                type="number"
                id="currentStock"
                min="0"
                step="1"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              id="description"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            {editItemId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isLoading}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : <FaPlusCircle className='mr-2 h-4 w-4' />}
              {editItemId ? (isLoading ? 'Updating...' : 'Update Item') : (isLoading ? 'Creating...' : 'Create Item')}
            </button>
          </div>
        </form>
      </div>

      {/* --- Items List Table --- */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Item List</h2>
        {isLoadingItems ? (
          <p className="text-center text-gray-500">Loading items...</p>
        ) : itemsError ? (
          <p className="text-center text-red-600 bg-red-50 p-3 rounded">
            Error loading items: {itemsError.response?.data?.message || itemsError.message}
            <button onClick={() => refetchItems()} className="ml-4 text-indigo-600 hover:text-indigo-800 underline">Retry</button>
          </p>
        ) : !itemsData || itemsData.length === 0 ? (
          <p className="text-center text-gray-500">No items found. Create one using the form above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemsData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.currentStock}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.description || ''}>{item.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleEdit(item)}
                        disabled={isDeleting || isUpdating || isCreating} // Disable while any mutation is running
                        className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Edit Item"
                      >
                        <FaEdit className="h-4 w-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting || isUpdating || isCreating} // Disable while any mutation is running
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Delete Item"
                      >
                        <FaTrashAlt className="h-4 w-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemsPage;