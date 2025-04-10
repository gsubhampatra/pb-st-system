import React from 'react';
import { FaPrint } from 'react-icons/fa';

const STATUS_OPTIONS = [
  { value: 'recorded', label: 'Recorded (Unpaid/Partially Paid)' },
  { value: 'paid', label: 'Paid in Full' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

function Step3Summary({
  selectedCustomer,
  saleItems,
  status,
  receivedAmount,
  totalAmount,
  onStatusChange,
  onReceivedAmountChange,
  onSubmit,
  onGoToPrev,
  isSubmitting,
  submitError,
}) {

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">Step 3: Summary and Save</h2>

      {/* --- Submission Error --- */}
      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">Error Saving Sale</h3>
          <p className="mt-2 text-sm text-red-700">{submitError.response?.data?.message || submitError.message || 'An unknown error occurred.'}</p>
        </div>
      )}

      {/* --- Summary Details --- */}
      <div className="p-4 border rounded-md bg-white space-y-4">
        <div>
          <h3 className="font-medium text-gray-700">Customer:</h3>
          <p className="text-sm text-gray-600">{selectedCustomer?.name || 'N/A'} ({selectedCustomer?.phone || 'No phone'})</p>
          <p className="text-sm text-gray-600">{selectedCustomer?.address || 'No address'}</p>
        </div>
        <div>
          <h3 className="font-medium text-gray-700">Items:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {saleItems.map((item, index) => (
              <li key={item.tempKey || item.itemId + index}>
                {item.quantity} x {item.itemName} @ {item.unitPrice.toFixed(2)} = {item.totalPrice.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t pt-2">
          <h3 className="text-lg font-semibold text-gray-800 text-right">
            Total Amount: {totalAmount.toFixed(2)}
          </h3>
        </div>
      </div>

      {/* --- Status and Payment --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="receivedAmount" className="block text-sm font-medium text-gray-700">
            Received Amount {status !== 'paid' ? '(Optional)' : ''}
          </label>
          <input
            type="number"
            id="receivedAmount"
            step="0.01"
            min="0"
            max={totalAmount}
            value={receivedAmount}
            onChange={(e) => onReceivedAmountChange(e.target.value)}
            required={status === 'paid'}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${status !== 'paid' ? 'bg-gray-100' : ''}`}
          />
          {status === 'paid' && parseFloat(receivedAmount || 0) !== totalAmount && (
            <p className="mt-1 text-xs text-orange-600">Status is 'Paid', but Received Amount doesn't match Total Amount.</p>
          )}
          {parseFloat(receivedAmount || 0) > 0 && parseFloat(receivedAmount || 0) < totalAmount && status !== 'partial' && (
            <p className="mt-1 text-xs text-blue-600">Consider setting status to 'Partially Paid'.</p>
          )}
        </div>
      </div>

      {/* --- Navigation and Actions --- */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onGoToPrev}
          disabled={isSubmitting}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Previous: Items
        </button>
        <div className="flex gap-3">
          {/* Save Button */}
          <button
            type="button"
            onClick={() => onSubmit(false)} // Pass false for print flag
            disabled={isSubmitting || saleItems.length === 0 || !selectedCustomer}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Sale'}
          </button>
          {/* Save and Print Button */}
          <button
            type="button"
            onClick={() => onSubmit(true)} // Pass true for print flag
            disabled={isSubmitting || saleItems.length === 0 || !selectedCustomer}
            className="ml-3 inline-flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <FaPrint className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Save & Print'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Step3Summary;