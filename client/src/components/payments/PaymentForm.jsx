import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { api, API_PATHS } from '../../api';
import { useSuppliers } from '../../contexts/SupplierContext';
import { FiSearch } from 'react-icons/fi';

const PaymentForm = ({ payment, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    supplierId: '',
    amount: '',
    method: 'cash',
    accountId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: '',
  });
  const [errors, setErrors] = useState({});

  // Use the SupplierContext for searching and selecting suppliers
  const { 
    suppliers, 
    isLoading: suppliersLoading, 
    searchTerm, 
    setSearchTerm 
  } = useSuppliers();

  // Fetch accounts for dropdown (when method is 'account')
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.accounts.getAll);
      return response.data.data;
    },
    enabled: formData.method === 'account'
  });

  // Initialize form with payment data if editing
  useEffect(() => {
    if (payment) {
      api.get(API_PATHS.payments.getById(payment.id))
        .then(response => {
          const paymentData = response.data;
          setFormData({
            supplierId: paymentData.supplierId,
            amount: paymentData.amount,
            method: paymentData.method,
            accountId: paymentData.accountId || '',
            date: format(new Date(paymentData.date), 'yyyy-MM-dd'),
            note: paymentData.note || '',
          });
        })
        .catch(error => console.error('Error fetching payment:', error));
    }
  }, [payment]);

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

  // Handle supplier selection
  const handleSelectSupplier = (supplier) => {
    setFormData(prev => ({
      ...prev,
      supplierId: supplier.id
    }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
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

  // Create or update payment mutation
  const savePayment = useMutation({
    mutationFn: async () => {
      const payload = {
        supplierId: formData.supplierId,
        amount: parseFloat(formData.amount),
        method: formData.method,
        accountId: formData.method === 'account' ? formData.accountId : undefined,
        date: formData.date,
        note: formData.note
      };

      if (payment) {
        // Update existing payment (note: only date and note are updatable)
        return api.put(API_PATHS.payments.update(payment.id), {
          date: payload.date,
          note: payload.note
        });
      } else {
        // Create new payment
        return api.post(API_PATHS.payments.create, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['accounts']); // Refresh accounts as balance might change
      onSuccess();
    },
    onError: (error) => {
      console.error('Error saving payment:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to save payment'}`);
    }
  });

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      savePayment.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Date */}
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

      {/* Supplier Selection - disabled when editing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Supplier *
        </label>
        
        {payment ? (
          // When editing, just show the supplier name
          <select
            name="supplierId"
            value={formData.supplierId}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={true}
          >
            <option value={formData.supplierId}>{payment?.supplier?.name || "Selected Supplier"}</option>
          </select>
        ) : (
          // When creating new, show search and selection
          <div className="space-y-2">
            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search suppliers by name..."
              />
            </div>

            {/* Suppliers List */}
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {suppliersLoading ? (
                <div className="text-center py-2">Loading suppliers...</div>
              ) : suppliers?.length ? (
                <div className="divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <div 
                      key={supplier.id} 
                      className={`p-2 hover:bg-gray-50 cursor-pointer ${formData.supplierId === supplier.id ? 'bg-blue-50' : ''}`}
                      onClick={() => handleSelectSupplier(supplier)}
                    >
                      <div className="font-medium text-gray-900">{supplier.name}</div>
                      <div className="text-sm text-gray-500">
                        {supplier.phone || 'No phone'} • Balance: ${supplier.balance?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-gray-500">
                  {searchTerm ? 'No suppliers found matching your search' : 'No suppliers available'}
                </div>
              )}
            </div>
          </div>
        )}
        {errors.supplierId && <p className="mt-1 text-sm text-red-600">{errors.supplierId}</p>}
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
            disabled={!!payment} // Disable when editing
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
              disabled={!!payment} // Disable when editing
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
              disabled={!!payment} // Disable when editing
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
            disabled={!!payment} // Disable when editing
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
      {payment && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Note About Editing</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  For financial integrity, you can only update the date and note fields of an existing payment.
                  To change other details, please delete this payment and create a new one.
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
          disabled={savePayment.isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {savePayment.isLoading ? 'Saving...' : payment ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;