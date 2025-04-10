import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api, API_PATHS } from '../../api';
import { format } from 'date-fns';

const EditSaleForm = ({ sale, onSuccess }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    receivedAmount: 0,
    status: 'recorded'
  });

  // Initialize form with sale data
  useEffect(() => {
    if (sale) {
      setFormData({
        receivedAmount: sale.receivedAmount,
        status: sale.status
      });
    }
  }, [sale]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'receivedAmount' ? parseFloat(value) : value
    }));
  };

  // Update sale mutation
  const updateSale = useMutation({
    mutationFn: async () => {
      return api.put(API_PATHS.sales.update(sale.id), {
        receivedAmount: parseFloat(formData.receivedAmount),
        status: formData.status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      onSuccess();
      alert('Sale updated successfully');
    },
    onError: (error) => {
      console.error('Error updating sale:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to update sale'}`);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSale.mutate();
  };

  // Calculate due amount
  const dueAmount = sale ? sale.totalAmount - formData.receivedAmount : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Sale Details</h3>
          <div className="bg-gray-100 p-4 rounded-md">
            <p><strong>Date:</strong> {sale ? format(new Date(sale.date), 'MMMM dd, yyyy') : ''}</p>
            <p><strong>Customer:</strong> {sale?.customer?.name}</p>
            <p><strong>Total Amount:</strong> ${sale?.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Items</h3>
          <div className="bg-gray-100 p-4 rounded-md max-h-48 overflow-y-auto">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {sale?.items.map((item) => (
                <li key={item.id}>
                  {item.quantity} x {item.item.name} @ ${item.unitPrice.toFixed(2)} = ${(item.quantity * item.unitPrice).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <label htmlFor="receivedAmount" className="block text-sm font-medium text-gray-700">
            Received Amount
          </label>
          <input
            type="number"
            id="receivedAmount"
            name="receivedAmount"
            min="0"
            step="0.01"
            max={sale?.totalAmount}
            value={formData.receivedAmount}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {dueAmount < 0 && (
            <p className="mt-1 text-sm text-red-600">
              Received amount cannot exceed total amount.
            </p>
          )}
          <p className="mt-1 text-sm text-gray-600">
            Due Amount: ${dueAmount.toFixed(2)}
          </p>
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
            <option value="partial">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end">
        <button
          type="submit"
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {updateSale.isLoading ? 'Updating...' : 'Update Sale'}
        </button>
      </div>
    </form>
  );
};

export default EditSaleForm;