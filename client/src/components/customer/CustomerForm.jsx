import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api, API_PATHS } from '../../api';
import Button from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';

const CustomerForm = ({ customer, onSuccess }) => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [localError, setLocalError] = useState('');

  // Initialize form with customer data if editing
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || ''
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create or update customer mutation
  const saveCustomer = useMutation({
    mutationFn: async () => {
      if (customer) {
        return api.put(API_PATHS.customers.update(customer.id), formData);
      } else {
        return api.post(API_PATHS.customers.create, formData);
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['customers']);
      notify(customer ? 'Customer updated' : 'Customer created', { type: 'success' });
      onSuccess(res?.data);
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || e.message || 'Failed to save customer';
      setLocalError(msg);
      notify(msg, { type: 'error' });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setLocalError('Customer name is required');
      notify('Customer name is required', { type: 'warning' });
      return;
    }
    saveCustomer.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {localError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">{localError}</div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={3}
          value={formData.address}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        <Button variant="secondary" type="button" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveCustomer.isLoading}>
          {saveCustomer.isLoading ? 'Saving...' : customer ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;