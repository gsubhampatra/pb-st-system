import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api, API_PATHS } from '../../api';
import { format } from 'date-fns';

const EditPurchaseForm = ({ purchase, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    supplierId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    items: [],
    totalAmount: 0,
    paidAmount: 0,
    status: 'recorded'
  });

  // Fetch suppliers and items for dropdowns
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.suppliers.getAll);
      return response.data;
    }
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.items.getAll);
      return response.data;
    }
  });

  // Initialize form with purchase data if editing
  useEffect(() => {
    if (purchase) {
      // Fetch the full purchase details with items
      api.get(API_PATHS.purchases.getById(purchase.id))
        .then(response => {
          const purchaseData = response.data;
          setFormData({
            supplierId: purchaseData.supplierId,
            date: format(new Date(purchaseData.date), 'yyyy-MM-dd'),
            items: purchaseData.items.map(item => ({
              itemId: item.itemId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              itemName: item.item.name // For display
            })),
            totalAmount: purchaseData.totalAmount,
            paidAmount: purchaseData.paidAmount,
            status: purchaseData.status
          });
        });
    }
  }, [purchase]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'unitPrice' ? parseFloat(value) : value
    };
    
    // Calculate total amount
    const totalAmount = updatedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemId: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const totalAmount = updatedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    }));
  };

  // Create or update purchase mutation
  const savePurchase = useMutation({
    mutationFn: async () => {
      const payload = {
        supplierId: formData.supplierId,
        date: formData.date,
        items: formData.items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        totalAmount: parseFloat(formData.totalAmount),
        paidAmount: parseFloat(formData.paidAmount),
        status: formData.status
      };

      if (purchase) {
        return api.put(API_PATHS.purchases.update(purchase.id), payload);
      } 
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      onSuccess();
    },
    onError: (error) => {
      console.error('Error saving purchase:', error);
      alert(error.response?.data?.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.supplierId) {
      alert('Supplier is required');
      return;
    }
    if (formData.items.length === 0) {
      alert('At least one item is required');
      return;
    }
    if (formData.items.some(item => !item.itemId || item.quantity <= 0 || item.unitPrice < 0)) {
      alert('All items must have valid quantity and unit price');
      return;
    }
    savePurchase.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">
            Supplier *
          </label>
          <select
            id="supplierId"
            name="supplierId"
            value={formData.supplierId}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select Supplier</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </div>

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
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Items *
        </label>
        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <select
                  value={item.itemId}
                  onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Item</option>
                  {items.map(itemOption => (
                    <option key={itemOption.id} value={itemOption.id}>
                      {itemOption.name} ({itemOption.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Unit Price"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="col-span-1 text-right">
                <span className="font-medium">
                  ${(item.quantity * item.unitPrice).toFixed(2)}
                </span>
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addItem}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            + Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div>
          <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
            Total Amount
          </label>
          <input
            type="number"
            id="totalAmount"
            name="totalAmount"
            value={formData.totalAmount}
            readOnly
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700">
            Paid Amount
          </label>
          <input
            type="number"
            id="paidAmount"
            name="paidAmount"
            min="0"
            step="0.01"
            value={formData.paidAmount}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="recorded">Recorded</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={savePurchase.isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {savePurchase.isLoading ? 'Saving...' : purchase ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default EditPurchaseForm;