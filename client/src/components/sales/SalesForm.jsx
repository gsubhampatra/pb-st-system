import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { format } from 'date-fns';
import { useCustomers } from '../../contexts/CustomerContext';
import { useItems } from '../../contexts/ItemContext';

function SalesForm({ saleId, onSuccess, onClose }) {
  const queryClient = useQueryClient();
  const { customers } = useCustomers();
  const { items } = useItems();

  // Fetch sale data if in edit mode
  const { data: saleData } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => api.get(API_PATHS.sales.getById(saleId)),
    enabled: !!saleId,
  });

  const [formData, setFormData] = useState({
    customerId: '',
    items: [],
    receivedAmount: 0,
    status: 'recorded',
  });

  const [totalAmount, setTotalAmount] = useState(0);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form with sale data when in edit mode
  useEffect(() => {
    if (saleData?.data) {
      setFormData({
        customerId: saleData.data.customerId || '',
        items: saleData.data.items?.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
        receivedAmount: saleData.data.receivedAmount || 0,
        status: saleData.data.status || 'recorded',
      });
    }
  }, [saleData]);

  useEffect(() => {
    const total = formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    setTotalAmount(total);
  }, [formData.items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { itemId: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validateStock = (itemId, quantity) => {
    const item = items.find((i) => i.id === itemId);
    if (item && quantity > item.currentStock) {
      return `Quantity exceeds available stock (${item.currentStock}).`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const validationErrors = {};
    formData.items.forEach((item, index) => {
      const error = validateStock(item.itemId, item.quantity);
      if (error) {
        validationErrors[index] = error;
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    const saleData = {
      ...formData,
      totalAmount,
      date: format(new Date(), 'yyyy-MM-dd'),
    };

    try {
      if (saleId) {
        await api.put(API_PATHS.sales.update(saleId), saleData);
      } else {
        await api.post(API_PATHS.sales.create, saleData);
      }

      queryClient.invalidateQueries(['sales']);
      onSuccess?.();
    } catch (error) {
      alert('An error occurred while saving the sale. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {saleId ? 'Edit Sale' : 'Create New Sale'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
              Customer
            </label>
            <select
              id="customerId"
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              required
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Items</h3>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleAddItem}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Add Item
              </button>
              <div className="text-lg font-semibold">
                Total: ₹{totalAmount.toFixed(2)}
              </div>
            </div>
            <ul className="mt-4 space-y-4">
              {formData.items.map((item, index) => (
                <li key={index} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <select
                      value={item.itemId}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].itemId = e.target.value;
                        // Auto-fill the unit price when item is selected
                        const selectedItem = items.find(i => i.id === e.target.value);
                        if (selectedItem) {
                          newItems[index].unitPrice = selectedItem.sellingPrice;
                        }
                        setFormData((prev) => ({ ...prev, items: newItems }));
                      }}
                      className="w-full border border-gray-300 rounded-md py-2 px-3"
                      required
                    >
                      <option value="">Select Item</option>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.currentStock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].quantity = parseInt(e.target.value, 10) || 0;
                        setFormData((prev) => ({ ...prev, items: newItems }));

                        const error = validateStock(newItems[index].itemId, newItems[index].quantity);
                        setErrors((prevErrors) => ({ ...prevErrors, [index]: error }));
                      }}
                      className="w-full border border-gray-300 rounded-md py-2 px-3"
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                        setFormData((prev) => ({ ...prev, items: newItems }));
                      }}
                      className="w-full border border-gray-300 rounded-md py-2 px-3"
                      required
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  {errors[index] && (
                    <div className="col-span-12 text-red-600 text-sm">
                      {errors[index]}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="receivedAmount" className="block text-sm font-medium text-gray-700">
                Received Amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                id="receivedAmount"
                name="receivedAmount"
                value={formData.receivedAmount}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              >
                <option value="recorded">Recorded</option>
                <option value="partial">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : saleId ? 'Update Sale' : 'Create Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SalesForm;