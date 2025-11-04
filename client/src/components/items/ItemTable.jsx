import React from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import Spinner from '../ui/Spinner';

const ItemTable = ({
  items,
  isLoading,
  error,
  onEdit,
  onDelete,
  onRetry,
  isActionDisabled,
}) => {
  // Stock display unit selection
  const UNIT_OPTIONS = [
    { label: 'KG', value: 'KG' },
    { label: 'PKT (50 KG)', value: 'PKT' },
    { label: 'QNTL (100 KG)', value: 'QNTL' },
    { label: 'TON (1000 KG)', value: 'TON' },
  ];
  const KG_PER_UNIT = { KG: 1, PKT: 50, QNTL: 100, TON: 1000 };
  const [stockUnit, setStockUnit] = React.useState('KG');

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Item List</h2>
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Item List</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-semibold">Error loading items</p>
          <p className="text-sm">{error.message}</p>
          <button
            onClick={onRetry}
            className="mt-2 text-indigo-600 hover:text-indigo-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Item List</h2>
        <p className="text-center text-gray-500 py-8">
          No items found. Create one using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Item List</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="stockUnit" className="text-sm text-gray-600">Stock Unit:</label>
          <select
            id="stockUnit"
            value={stockUnit}
            onChange={(e) => setStockUnit(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Base Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selling Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock ({stockUnit})
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {item.category || '-'}
                </td>
                {/* Unit (base) */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {item.unit || 'kg'}
                </td>
                {/* Base Price */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  ₹{item.basePrice ? Number(item.basePrice).toFixed(2) : '0.00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  ₹{item.sellingPrice ? Number(item.sellingPrice).toFixed(2) : '0.00'}
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    item.stock < 10 ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  {(() => {
                    const kg = item.stock ? Number(item.stock) : 0;
                    const factor = KG_PER_UNIT[stockUnit] || 1;
                    const converted = kg / factor;
                    return (
                      <div className="leading-tight">
                        <div>{converted.toFixed(2)}</div>
                        <div className="text-xs text-gray-400">({kg.toFixed(2)} kg)</div>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                  <button
                    onClick={() => onEdit(item)}
                    disabled={isActionDisabled}
                    className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    title="Edit Item"
                  >
                    <FaEdit className="h-4 w-4 inline" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    disabled={isActionDisabled}
                    className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    title="Delete Item"
                  >
                    <FaTrashAlt className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ItemTable;
