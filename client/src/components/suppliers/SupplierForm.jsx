import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api, API_PATHS } from '../../api';
import { useToast } from '../../contexts/ToastContext';
import Button from '../ui/Button';

const SupplierForm = ({ supplier, onSuccess }) => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        phone: supplier.phone || '',
        address: supplier.address || ''
      });
    }
  }, [supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const saveSupplier = useMutation({
    mutationFn: async () => {
      if (supplier) {
        return api.put(API_PATHS.suppliers.update(supplier.id), formData);
      }
      return api.post(API_PATHS.suppliers.create, formData);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['suppliers']);
      notify(supplier ? 'Supplier updated successfully' : 'Supplier created successfully', { type: 'success' });
      onSuccess?.(res?.data);
    },
    onError: (error) => {
      notify(error.message || 'Failed to save supplier', { type: 'error' });
    }
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Supplier name is required';
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number should be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    saveSupplier.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={saveSupplier.isPending}
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
        <input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="10-digit number"
          disabled={saveSupplier.isPending}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
        <textarea
          id="address"
          name="address"
          rows={3}
          value={formData.address}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={saveSupplier.isPending}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
        <Button 
          type="button" 
          onClick={onSuccess} 
          variant="secondary"
          disabled={saveSupplier.isPending}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          loading={saveSupplier.isPending}
        >
          {supplier ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
