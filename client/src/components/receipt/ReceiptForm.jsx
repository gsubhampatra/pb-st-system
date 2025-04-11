import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { api, API_PATHS } from '../../api';
import { FiSearch } from 'react-icons/fi';
import { useCustomers } from '../../contexts/CustomerContext';

const ReceiptForm = ({ receipt, onSuccess: onDone }) => {
  const queryClient = useQueryClient();
  const { customers, isLoading: customersLoading, searchTerm, setSearchTerm } = useCustomers();
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    amount: '',
    method: 'cash',
    accountId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });
  const [errors, setErrors] = useState({});
  const [customerSearchFocused, setCustomerSearchFocused] = useState(false);

  // Fetch accounts for dropdown (when method is 'account')
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.accounts.getAll);
      return response.data.data;
    },
    enabled: formData.method === 'account'
  });

  // Initialize form with receipt data if editing
  useEffect(() => {
    if (receipt) {
      api.get(API_PATHS.receipts.getById(receipt.id))
        .then(response => {
          const receiptData = response.data;
          setFormData({
            customerId: receiptData.customerId,
            customerName: receiptData.customer.name,
            amount: receiptData.amount,
            method: receiptData.method,
            accountId: receiptData.accountId || '',
            date: format(new Date(receiptData.date), 'yyyy-MM-dd'),
            note: receiptData.note || '',
          });
        })
        .catch(error => console.error('Error fetching receipt:', error));
    }
  }, [receipt]);

  // Handle customer search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name
    }));
    setCustomerSearchFocused(false);
    // Clear any validation errors
    if (errors.customerId) {
      setErrors(prev => ({ ...prev, customerId: undefined }));
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' && value !== '' ? parseFloat(value) : value
    }));

    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // When method changes to 'cash', clear accountId
    if (name === 'method' && value === 'cash') {
      setFormData(prev => ({ ...prev, accountId: '' }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.method) {
      newErrors.method = 'Payment method is required';
    }
    
    if (formData.method === 'account' && !formData.accountId) {
      newErrors.accountId = 'Account is required for account payment method';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create or update receipt mutation
  const saveReceipt = useMutation({
    mutationFn: async () => {
      const payload = {
        customerId: formData.customerId,
        amount: parseFloat(formData.amount),
        method: formData.method,
        accountId: formData.method === 'account' ? formData.accountId : undefined,
        date: formData.date,
        note: formData.note
      };

      if (receipt) {
        // Update existing receipt (note: only date and note are updatable)
        return api.put(API_PATHS.receipts.update(receipt.id), {
          date: payload.date,
          note: payload.note
        });
      } else {
        // Create new receipt
        return api.post(API_PATHS.receipts.create, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['receipts']);
      queryClient.invalidateQueries(['accounts']); // Refresh accounts as balance might change
      queryClient.invalidateQueries(['customers']); // Refresh customers as credit might change
      onDone();
    },
    onError: (error) => {
      console.error('Error saving receipt:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to save receipt'}`);
    }
  });

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      saveReceipt.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Receipt Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Date *
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      {/* Customer Selection - disabled when editing */}
      <div className="relative">
        <label htmlFor="customerSearch" className="block text-sm font-medium text-gray-700">
          Customer *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            id="customerSearch"
            placeholder={formData.customerName || "Search for customer..."}
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setCustomerSearchFocused(true)}
            className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={!!receipt} // Disable when editing
          />
        </div>
        {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
        
        {customerSearchFocused && !receipt && (
          <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto">
            {customersLoading ? (
              <div className="p-4 text-center text-gray-500">Loading customers...</div>
            ) : customers?.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {customers.map(customer => (
                  <li
                    key={customer.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${formData.customerId === customer.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">
                      {customer.phone || 'No phone'} • Credit: ${customer.credit?.toFixed(2) || '0.00'}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No customers found matching your search' : 'Type to search for customers'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Amount - disabled when editing */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount *
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">$</span>
          </div>
          <input
            type="number"
            id="amount"
            name="amount"
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={handleChange}
            className="block w-full pl-7 pr-12 border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
            aria-describedby="amount-currency"
            required
            disabled={!!receipt} // Disable when editing
          />
        </div>
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
      </div>

      {/* Payment Method - disabled when editing */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Payment Method *
        </label>
        <div className="mt-1 space-y-2">
          <div className="flex items-center">
            <input
              id="method-cash"
              name="method"
              type="radio"
              value="cash"
              checked={formData.method === 'cash'}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              disabled={!!receipt} // Disable when editing
            />
            <label htmlFor="method-cash" className="ml-2 block text-sm text-gray-700">
              Cash
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="method-account"
              name="method"
              type="radio"
              value="account"
              checked={formData.method === 'account'}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              disabled={!!receipt} // Disable when editing
            />
            <label htmlFor="method-account" className="ml-2 block text-sm text-gray-700">
              Bank Account
            </label>
          </div>
        </div>
        {errors.method && <p className="mt-1 text-sm text-red-600">{errors.method}</p>}
      </div>

      {/* Account Selection - only shown for account method, disabled when editing */}
      {formData.method === 'account' && (
        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-gray-700">
            Select Account *
          </label>
          <select
            id="accountId"
            name="accountId"
            value={formData.accountId}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={!!receipt} // Disable when editing
          >
            <option value="">Select an Account</option>
            {accounts?.map(account => (
              <option key={account.id} value={account.id}>
                {account.bankName} - {account.accountNumber} (Balance: ${account.balance.toFixed(2)})
              </option>
            ))}
          </select>
          {errors.accountId && <p className="mt-1 text-sm text-red-600">{errors.accountId}</p>}
        </div>
      )}

      {/* Note */}
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
          Note
        </label>
        <textarea
          id="note"
          name="note"
          rows="3"
          value={formData.note}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any additional notes..."
        />
      </div>

      {/* Form Message */}
      {receipt && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Note About Editing</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  For financial integrity, you can only update the date and note fields of an existing receipt.
                  To change other details, please delete this receipt and create a new one.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onSuccess}
          className="mr-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saveReceipt.isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {saveReceipt.isLoading ? 'Saving...' : receipt ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default ReceiptForm;