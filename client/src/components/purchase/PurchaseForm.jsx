import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { useNavigate } from 'react-router-dom';
import { FaTrashAlt, FaPrint } from 'react-icons/fa';
import SearchableSelect from './ui/SearchableSelect';
import LangInput from '../LangInput';
import { useSuppliers } from '../../contexts/SupplierContext';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'paid', label: 'Full Paid' },
  { value: 'partial', label: 'Partial Paid' },
];

function PurchaseForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const itemSelectRef = useRef(null);
  const itemQuantityRef = useRef(null);
  const itemUnitPriceRef = useRef(null);
  const addItemButtonRef = useRef(null);
  const paidAmountRef = useRef(null);
  const saveButtonRef = useRef(null);
  const saveAndPrintButtonRef = useRef(null);

  const handleKeyDown = (event) => {
    // Global item-entry shortcuts
    if (event.key === 'Escape') {
      // Clear current row inputs
      setSelectedItemToAdd(null);
      setItemQuantity(1);
      setItemUnitPrice('');
      itemSelectRef.current?.focus();
      return;
    }

    const isCtrlEnter = event.key === 'Enter' && (event.ctrlKey || event.metaKey);
    if (isCtrlEnter) {
      event.preventDefault();
      addItemButtonRef.current?.click();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const active = document.activeElement;
      if (active === itemSelectRef.current) {
        // Prefill price from item if available, then go to quantity
        if (selectedItemToAdd?.basePrice != null && (itemUnitPrice === '' || itemUnitPrice == null)) {
          setItemUnitPrice(String(selectedItemToAdd.basePrice));
        }
        itemQuantityRef.current?.focus();
      } else if (active === itemQuantityRef.current) {
        // If price is already set (auto), add the item directly; else go to price
        const hasPrice = itemUnitPrice !== '' && !isNaN(parseFloat(itemUnitPrice));
        if (!hasPrice && selectedItemToAdd?.basePrice != null) {
          setItemUnitPrice(String(selectedItemToAdd.basePrice));
        }
        const validQty = !isNaN(parseFloat(itemQuantity)) && parseFloat(itemQuantity) > 0;
        const priceReady = (hasPrice || selectedItemToAdd?.basePrice != null);
        if (validQty && priceReady) {
          addItemButtonRef.current?.click();
        } else {
          itemUnitPriceRef.current?.focus();
        }
      } else if (active === itemUnitPriceRef.current) {
        addItemButtonRef.current?.click();
      } else if (active === paidAmountRef.current) {
        saveButtonRef.current?.click();
      }
    }
  };

  // --- Supplier State ---
  const {
    suppliers: suppliersData,
    isLoading: isLoadingSuppliers,
    searchTerm: supplierSearchTerm, // Rename to avoid conflict
    setSearchTerm: setSupplierSearchTerm,
  } = useSuppliers();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showCreateSupplierForm, setShowCreateSupplierForm] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');

  // --- Item State ---
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [selectedItemToAdd, setSelectedItemToAdd] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemUnitPrice, setItemUnitPrice] = useState('');

  // --- Summary State ---
  const [status, setStatus] = useState('paid');
  const [paidAmount, setPaidAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceNo, setInvoiceNo] = useState('');

  // Generate invoice number on mount
  useEffect(() => {
    const generateInvoiceNo = () => {
      const today = new Date();
      const year = today.getFullYear().toString().slice(2);
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");
      const timestamp = Date.now().toString().slice(-4);
      return `${year}${month}${day}${timestamp}`;
    };
    setInvoiceNo(generateInvoiceNo());
  }, []);

  // --- Calculate Total Amount ---
  useEffect(() => {
    const total = purchaseItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    setTotalAmount(total);
    // If status is 'paid', update paid amount to match new total
    if (status === 'paid') {
      setPaidAmount(total.toFixed(2));
    }
  }, [purchaseItems, status]); // Add status dependency

  // --- Supplier Logic ---
  const handleSupplierSearchChange = (query) => {
    setSupplierSearchTerm(query);
  };

  const handleSupplierSelect = (supplier) => {
    if (supplier) {
      setSelectedSupplier(supplier);
      setShowCreateSupplierForm(false); // Hide form if a supplier is selected
    }
  };

  const { mutate: createSupplier, isLoading: isCreatingSupplier, error: createSupplierError } = useMutation({
    mutationFn: (newSupplier) => api.post(API_PATHS.suppliers.create, newSupplier),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['suppliers']);
      setSelectedSupplier(data.data);
      setShowCreateSupplierForm(false);
      setNewSupplierName(''); setNewSupplierPhone(''); setNewSupplierAddress('');
    },
    onError: (error) => {
      console.error("Error creating supplier:", error);
      // Display error to user (e.g., using a toast notification or inline message)
      alert(`Error creating supplier: ${error.response?.data?.message || error.message}`);
    }
  });

  const handleCreateSupplierSubmit = (e) => {
    e.preventDefault();
    if (!newSupplierName.trim()) {
      alert('Supplier name is required.');
      return;
    }
    createSupplier({
      name: newSupplierName,
      phone: newSupplierPhone,
      address: newSupplierAddress
    });
  };

  const { data: itemsData = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['items', itemSearchTerm],
    queryFn: async () => {
      const response = await api.get(API_PATHS.items.getAll, {
        params: { search: itemSearchTerm }
      });
      return response.data.items || response.data || [];
    },
    enabled: !!itemSearchTerm || itemSearchTerm === '', // Always fetch, but filter by search term
    placeholderData: [],
  });

  // When item is selected, auto-fill unit price from item's basePrice if empty
  useEffect(() => {
    if (selectedItemToAdd?.basePrice != null) {
      setItemUnitPrice((prev) => (prev === '' || prev == null ? String(selectedItemToAdd.basePrice) : prev));
    }
  }, [selectedItemToAdd]);

  const handleItemSearchChange = (query) => {
    setItemSearchTerm(query);
  };

  const handleItemSelect = (item) => {
    setSelectedItemToAdd(item);
    if (item) {
      // Focus on quantity after selection
      setTimeout(() => itemQuantityRef.current?.focus(), 100);
    }
  };



  const handleAddItemClick = () => {
    if (!selectedItemToAdd || itemQuantity <= 0 || itemUnitPrice === '' || isNaN(parseFloat(itemUnitPrice))) {
      alert('Please select an item and enter valid quantity and unit price.');
      return;
    }

    const newItem = {
      itemId: selectedItemToAdd.id,
      itemName: selectedItemToAdd.name,
      unit: selectedItemToAdd.unit,
      quantity: parseFloat(itemQuantity),
      unitPrice: parseFloat(itemUnitPrice),
      totalPrice: parseInt(parseFloat(itemQuantity) * parseFloat(itemUnitPrice)),
      tempKey: `${selectedItemToAdd.id}-${Date.now()}` // Unique key for list rendering
    };
    setPurchaseItems((prev) => [...prev, newItem]);

    // Reset item form
    setSelectedItemToAdd(null);
    setItemSearchTerm('');
    setItemQuantity(1);
    setItemUnitPrice('');
  };

  const handleRemoveItem = (itemKey) => {
    setPurchaseItems((prev) => prev.filter(item => item.tempKey !== itemKey));
  };

  // Inline update for unit price in the added items table
  const handleInlineUnitPriceChange = (itemKey, value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return; // Ignore invalid input
    setPurchaseItems((prev) => prev.map((it) => {
      if (it.tempKey === itemKey) {
        const newTotal = parseFloat(it.quantity) * num;
        return { ...it, unitPrice: num, totalPrice: newTotal };
      }
      return it;
    }));
  };

  // Add edit functionality for items
  const handleEditItem = (itemKey) => {
    const itemToEdit = purchaseItems.find(item => item.tempKey === itemKey);
    if (itemToEdit) {
      setSelectedItemToAdd({ id: itemToEdit.itemId, name: itemToEdit.itemName, unit: itemToEdit.unit });
      setItemQuantity(itemToEdit.quantity);
      setItemUnitPrice(itemToEdit.unitPrice);
      handleRemoveItem(itemKey); // Remove the item being edited from the list
    }
  };

  // --- Summary Logic ---
  const handleStatusChange = (newStatus) => {
    setStatus(newStatus);
    if (newStatus === 'paid') {
      // Full Paid: automatically set paid amount to total
      setPaidAmount(totalAmount.toFixed(2));
    } else if (newStatus === 'partial') {
      // Partial Paid: clear paid amount for manual entry
      setPaidAmount('');
    }
  };

  const handlePaidAmountChange = (amount) => {
    setPaidAmount(amount);
  };

  // --- Submission Logic ---
  const { mutate: createPurchase, isLoading: isSubmitting, error: submitError, reset: resetMutation } = useMutation({
    mutationFn: (purchaseData) => api.post(API_PATHS.purchases.create, purchaseData),
    onSuccess: (data, variables) => {
      console.log('Purchase created successfully:', data);
      queryClient.invalidateQueries(['purchases']);
      queryClient.invalidateQueries(['items']); // Invalidate items if purchase affects stock/price

      // Reset form state
      setSelectedSupplier(null);
      setPurchaseItems([]);
      setStatus('partial');
      setPaidAmount('');
      setTotalAmount(0);
      setPurchaseDate(format(new Date(), 'yyyy-MM-dd'));
      // Generate new invoice number
      const today = new Date();
      const year = today.getFullYear().toString().slice(2);
      const month = (today.getMonth() + 1).toString().padStart(2, "0");
      const day = today.getDate().toString().padStart(2, "0");
      const timestamp = Date.now().toString().slice(-4);
      setInvoiceNo(`${year}${month}${day}${timestamp}`);
      resetMutation(); // Reset mutation state (error, loading)

      // Navigate to invoice if print was requested
      if (variables.shouldPrint) {
        navigate(`/purchases/invoice/${data.data.id}`);
      } else {
        // Optionally navigate back to purchase list or show success message
        alert('Purchase saved successfully!');
        // navigate('/purchases'); // Example navigation
      }
    },
    onError: (error) => {
      console.error("Error creating purchase:", error);
      // Error is displayed via submitError state below
    }
  });

  const handleSubmit = (shouldPrint = false) => {
    if (!selectedSupplier) {
      alert('Please select or create a supplier.');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Please add at least one item to the purchase.');
      return;
    }
    
    // Validation for Full Paid status
    if (status === 'paid') {
      const paid = parseFloat(paidAmount || 0);
      if (paid !== totalAmount) {
        alert(`Full Paid selected but amount (${paid}) doesn't match total (${totalAmount.toFixed(2)}). Please check.`);
        return;
      }
    }
    
    // Validation for Partial Paid status
    if (status === 'partial') {
      if (paidAmount === '' || isNaN(parseFloat(paidAmount))) {
        alert('Partial Paid selected. Please enter the paid amount.');
        return;
      }
      const paid = parseFloat(paidAmount);
      if (paid < 0) {
        alert('Paid amount cannot be negative.');
        return;
      }
      if (paid > totalAmount) {
        alert(`Paid amount (${paid}) cannot exceed total amount (${totalAmount.toFixed(2)}).`);
        return;
      }
    }

    const purchaseData = {
      supplierId: selectedSupplier.id,
      invoiceNo: invoiceNo,
      date: new Date(purchaseDate).toISOString(), // Use selected date
      items: purchaseItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        // unit: 'kg' - Removed, backend will default to 'kg'
      })),
      totalAmount: totalAmount,
      paidAmount: parseFloat(paidAmount || 0), // Default to 0 if empty
      status: status,
      shouldPrint: shouldPrint // Pass print flag to mutation variables
    };

    console.log("Submitting Purchase Data:", purchaseData);
    createPurchase(purchaseData);
  };


  // --- Render ---
  return (
    <div className="container mx-auto px-1 py-8 space-y-8 max-w-6xl relative">
      {isSubmitting && (
        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <svg className="h-5 w-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="text-sm text-gray-700">Saving purchase…</span>
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Purchase</h1>

      {/* --- Submission Error --- */}
      {submitError && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <h3 className="text-sm font-medium text-red-800">Error Saving Purchase</h3>
          <p className="mt-2 text-sm text-red-700">{submitError.response?.data?.message || submitError.message || 'An unknown error occurred.'}</p>
        </div>
      )}

      {/* --- Section 1: Supplier and Date --- */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Supplier & Date</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invoice Number Display */}
          <div>
            <label htmlFor="invoiceNo" className="block text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              id="invoiceNo"
              value={invoiceNo}
              readOnly
              className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
            />
          </div>

          {/* Supplier Selection */}
          <div>
            <SearchableSelect
              label="Search and Select Supplier *"
              items={suppliersData || []}
              selected={selectedSupplier}
              onSelect={handleSupplierSelect}
              onQueryChange={handleSupplierSearchChange}
              placeholder="Type to search suppliers..."
              loading={isLoadingSuppliers}
              displayValue={(supplier) => supplier ? `${supplier.name} (${supplier.phone || 'No phone'})` : ''}
            />
            {!showCreateSupplierForm && (
              <button
                type="button"
                onClick={() => setShowCreateSupplierForm(true)}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                + Create New Supplier
              </button>
            )}
          </div>

          {/* Purchase Date */}
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date *</label>
            <input
              type="date"
              id="purchaseDate"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
        </div>

        {/* Create Supplier Form (Conditional) */}
        {showCreateSupplierForm && (
          <form onSubmit={handleCreateSupplierSubmit} className="mt-6 p-4 border rounded-md bg-gray-50 space-y-3">
            <h3 className="font-medium text-gray-700">Create New Supplier</h3>
            {createSupplierError && <p className="text-red-600 text-sm">Error: {createSupplierError.response?.data?.message || createSupplierError.message}</p>}
            <div>
              <label htmlFor="newSupplierName" className="block text-sm font-medium text-gray-700">Name *</label>
              <LangInput
                type="text"
                id="newSupplierName"
                value={newSupplierName}
                onChange={setNewSupplierName}
                isRequired={true}
                placeholder="Supplier Name"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="newSupplierPhone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                id="newSupplierPhone"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="newSupplierAddress" className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                id="newSupplierAddress"
                rows="1"
                value={newSupplierAddress}
                onChange={(e) => setNewSupplierAddress(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                className="mt-1  p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateSupplierForm(false)}
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
      </section>

      {/* --- Section 2: Items --- */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Purchase Items</h2>

        {/* Item Entry Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-md bg-gray-50 mb-6">
          {/* Item Selection */}
          <div className="md:col-span-4">
            <SearchableSelect
              label="Search Item *"
              items={itemsData || []}
              selected={selectedItemToAdd}
              onSelect={handleItemSelect}
              onQueryChange={handleItemSearchChange}
              placeholder="Type to search items..."
              loading={isLoadingItems}
              displayValue={(item) => item ? `${item.name} (${item.unit})` : ''}
            />
          </div>

          {/* Quantity */}
          <div className="md:col-span-2">
            <label htmlFor="itemQuantity" className="block text-sm font-medium text-gray-700">Quantity *</label>
            <input
              type="number"
              ref={itemQuantityRef}
              id="itemQuantity"
              min="0.01"
              step="any" // Allow decimals if needed, otherwise use "1"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={handleKeyDown}
              disabled={!selectedItemToAdd}
              className="mt-1 px-3 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              required
            />
          </div>

          {/* Unit Price */}
          <div className="md:col-span-2">
            <label htmlFor="itemUnitPrice" className="block text-sm font-medium text-gray-700">Unit Price *</label>
            <input
              type="number"
              ref={itemUnitPriceRef}
              id="itemUnitPrice"
              step="0.01"
              min="0"
              value={itemUnitPrice}
              onChange={(e) => setItemUnitPrice(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedItemToAdd}
              className="mt-1 px-3 py-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100"
              required
            />
          </div>

          {/* Item Total (Calculated) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Item Total</label>
            <p className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 sm:text-sm">
              {(selectedItemToAdd && !isNaN(itemQuantity) && !isNaN(itemUnitPrice) && itemQuantity > 0 && itemUnitPrice !== '')
                ? (parseFloat(itemQuantity) * parseFloat(itemUnitPrice)).toFixed(2)
                : '0.00'}
            </p>
          </div>

          {/* Add Button */}
          <div className="md:col-span-2">
            <button
              type="button"
              ref={addItemButtonRef}
              onClick={() => {
                handleAddItemClick();
                // After adding, refocus to item select for fast entry
                setTimeout(() => itemSelectRef.current?.focus(), 0);
              }}
              disabled={!selectedItemToAdd || itemQuantity <= 0 || itemUnitPrice === '' || isNaN(parseFloat(itemUnitPrice))}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Added Items Table */}
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
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {purchaseItems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="whitespace-nowrap py-4 px-3 text-sm text-center text-gray-500">
                          No items added yet. Use the form above to add items.
                        </td>
                      </tr>
                    ) : (
                      purchaseItems.map((item) => (
                        <tr key={item.tempKey}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{item.itemName} ({item.unit})</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.quantity}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              onFocus={(e) => e.target.select()}
                              value={item.unitPrice}
                              onChange={(e) => handleInlineUnitPriceChange(item.tempKey, e.target.value)}
                              className="w-28 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.totalPrice.toFixed(2)}</td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <button
                              onClick={() => handleEditItem(item.tempKey)}
                              className="text-blue-600 hover:text-blue-800 mr-2"
                              title="Edit Item"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.tempKey)}
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
                        <td></td> {/* Empty cell for actions column */}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section 3: Summary and Payment --- */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Summary & Payment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Total Amount Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Amount</label>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              ₹{totalAmount.toFixed(2)}
            </p>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status *</label>
            <select
              id="status"
              name="status"
              defaultValue={STATUS_OPTIONS[1].value}
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Paid Amount */}
          <div>
            <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700">
              Paid Amount {status === 'paid' ? '(Auto-filled)' : '*'}
            </label>
            <input
              type="number"
              id="paidAmount"
              step="0.01"
              min="0"
              ref={paidAmountRef}
              value={paidAmount}
              onChange={(e) => handlePaidAmountChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={status === 'paid'} // Disable for Full Paid
              required={status === 'partial'} // Required for Partial Paid
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 ${status === 'paid' ? 'bg-gray-100' : ''}`}
            />
            {status === 'paid' && (
              <p className="mt-1 text-xs text-green-600">Full payment automatically set to total amount.</p>
            )}
            {status === 'partial' && paidAmount !== '' && parseFloat(paidAmount || 0) > totalAmount && (
              <p className="mt-1 text-xs text-orange-600">Paid amount cannot exceed total amount.</p>
            )}
            {status === 'partial' && paidAmount !== '' && (isNaN(parseFloat(paidAmount)) || parseFloat(paidAmount) < 0) && (
              <p className="mt-1 text-xs text-red-600">Please enter a valid non-negative number.</p>
            )}
          </div>
        </div>
      </section>

      {/* --- Section 4: Actions --- */}
      <section className="flex justify-end gap-4 pt-6 border-t">
        {/* Maybe add a Cancel/Reset button here */}
        {/* <button type="button" onClick={() => navigate('/purchases')} className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
          Cancel
        </button> */}
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          ref={saveButtonRef}
          disabled={isSubmitting || purchaseItems.length === 0 || !selectedSupplier}
          className="inline-flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Purchase'}
        </button>
        <button
          type="button"
          ref={saveAndPrintButtonRef}
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting || purchaseItems.length === 0 || !selectedSupplier}
          className="inline-flex items-center justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <FaPrint className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Save & Print Invoice'}
        </button>
      </section>
    </div>
  );
}

export default PurchaseForm;