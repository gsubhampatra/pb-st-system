// src/features/purchase/Step2Items.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import SearchableSelect from './ui/SearchableSelect';
import debounce from 'lodash.debounce';
import { FaTrashAlt } from 'react-icons/fa'; // Example icon
import { api, API_PATHS } from '../../api';

function Step2Items({ purchaseItems, onAddItem, onRemoveItem, onUpdateItem, onGoToPrev, onGoToNext }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');

  // --- Fetch Items ---
   const debouncedSetSearchTerm = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    []
  );

  const handleSearchChange = (query) => {
    debouncedSetSearchTerm(query);
  };

  const { data: itemsData, isLoading: isLoadingItems } = useQuery({
    queryKey: ['items', searchTerm], // Include search term in key
    queryFn: async () => {
        // Assuming your backend /api/items supports a 'search' query param
        const response = await api.get(API_PATHS.items.getAll, {
            params: { search: searchTerm }
        });
        return response.data; // Expects an array of items [{id, name, basePrice, unit, ...}]
    },
    enabled: !!searchTerm, // Only fetch when searching
    placeholderData: [],
  });

   // --- Reset form when selected item changes ---
   useEffect(() => {
     setQuantity(1);
     // Set default price from item, allow override
     setUnitPrice(selectedItem?.basePrice !== undefined ? String(selectedItem.basePrice) : '');
   }, [selectedItem]);


  // --- Handle Adding Item ---
  const handleAddItemClick = () => {
    if (!selectedItem || quantity <= 0 || unitPrice === '' || isNaN(parseFloat(unitPrice))) {
      alert('Please select an item and enter valid quantity and unit price.');
      return;
    }

    const newItem = {
      itemId: selectedItem.id,
      itemName: selectedItem.name, // Store name for display
      unit: selectedItem.unit,     // Store unit for display
      quantity: parseInt(quantity, 10),
      unitPrice: parseFloat(unitPrice),
      totalPrice: parseInt(quantity, 10) * parseFloat(unitPrice),
      // Add a temporary unique key for React list rendering if needed before saving
      tempKey: `${selectedItem.id}-${Date.now()}`
    };
    onAddItem(newItem);

    // Reset form
    setSelectedItem(null);
    setSearchTerm(''); // Clear search might be needed depending on SearchableSelect impl.
    setQuantity(1);
    setUnitPrice('');
  };

  // Calculate overall total
  const totalAmount = purchaseItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Step 2: Add Purchase Items</h2>

      {/* --- Item Entry Form --- */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 border rounded-md bg-gray-50">
         {/* Item Selection */}
         <div className="md:col-span-2">
            <SearchableSelect
                label="Search Item"
                items={itemsData || []}
                selected={selectedItem}
                onSelect={setSelectedItem}
                onQueryChange={handleSearchChange}
                placeholder="Type to search items..."
                loading={isLoadingItems}
                displayValue={(item) => item ? `${item.name} (${item.unit})` : ''}
            />
         </div>

          {/* Quantity */}
          <div className="md:col-span-1">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={!selectedItem}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
          </div>

           {/* Unit Price */}
           <div className="md:col-span-1">
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700">Unit Price</label>
              <input
                type="number"
                id="unitPrice"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                disabled={!selectedItem}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              />
          </div>

           {/* Item Total (Calculated) */}
           <div className="md:col-span-1">
             <label className="block text-sm font-medium text-gray-700">Item Total</label>
             <p className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 sm:text-sm">
                 {selectedItem && !isNaN(quantity) && !isNaN(unitPrice) && quantity > 0 && unitPrice !== ''
                   ? (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2)
                   : '0.00'}
             </p>
           </div>


          {/* Add Button */}
          <div className="md:col-span-1">
            <button
              type="button"
              onClick={handleAddItemClick}
              disabled={!selectedItem || quantity <= 0 || unitPrice === '' || isNaN(parseFloat(unitPrice))}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Add Item
            </button>
          </div>
      </div>

      {/* --- Added Items Table --- */}
      <div className="mt-6 flow-root">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Item</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Price</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Price</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {purchaseItems.length === 0 ? (
                     <tr>
                         <td colSpan="5" className="whitespace-nowrap py-4 px-3 text-sm text-center text-gray-500">
                           No items added yet.
                         </td>
                     </tr>
                  ) : (
                    purchaseItems.map((item, index) => (
                      <tr key={item.tempKey || item.itemId + index}> {/* Use tempKey or generate one */}
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{item.itemName} ({item.unit})</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.quantity}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.unitPrice.toFixed(2)}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.totalPrice.toFixed(2)}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => onRemoveItem(item.tempKey || item.itemId + index)} // Use the same key as above
                            className="text-red-600 hover:text-red-800"
                            title="Remove Item"
                          >
                            <FaTrashAlt className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                 {purchaseItems.length > 0 && (
                   <tfoot>
                        <tr>
                            <td colSpan="3" className="py-3.5 pl-4 pr-3 text-right text-sm font-semibold text-gray-900 sm:pl-6">
                                Grand Total:
                            </td>
                             <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                {totalAmount.toFixed(2)}
                            </td>
                            <td></td> {/* Empty cell for remove column */}
                        </tr>
                   </tfoot>
                 )}
              </table>
            </div>
          </div>
        </div>
      </div>


      {/* --- Navigation --- */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onGoToPrev}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Previous: Supplier
        </button>
        <button
          type="button"
          onClick={onGoToNext}
          disabled={purchaseItems.length === 0}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Summary & Save
        </button>
      </div>
    </div>
  );
}

export default Step2Items;