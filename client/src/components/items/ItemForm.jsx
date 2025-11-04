import React from 'react';
import { FaPlusCircle } from 'react-icons/fa';
import LangInput from '../LangInput';
import Button from '../ui/Button';

const ItemForm = ({
  formData,
  onChange,
  onSubmit,
  onCancel,
  formError,
  isLoading,
  isEditing,
}) => {
  const { name, category, unit, basePrice, sellingPrice, stock } = formData;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">
        {isEditing ? 'Edit Item' : 'Create New Item'}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <LangInput
              type="text"
              id="name"
              value={name}
              onChange={(value) => onChange('name', value)}
              isRequired={true}
              placeholder="Enter item name"
              className="mt-1 block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => onChange('category', e.target.value)}
              placeholder="e.g., Electronics, Groceries"
              className="mt-1 block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition"
            />
          </div>

          {/* Unit - Fixed to kg */}
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
              Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="unit"
              value="kg"
              readOnly
              className="mt-1 block w-full px-4 py-3 rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              All items use kilogram (kg) as the standard unit
            </p>
          </div>

          {/* Base Price */}
          <div>
            <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700 mb-1">
              Base Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="basePrice"
              step="0.01"
              min="0"
              value={basePrice}
              onChange={(e) => onChange('basePrice', e.target.value)}
              required
              placeholder="0.00"
              className="mt-1 block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label htmlFor="sellingPrice" className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price
            </label>
            <input
              type="number"
              id="sellingPrice"
              step="0.01"
              min="0"
              value={sellingPrice}
              onChange={(e) => onChange('sellingPrice', e.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional - leave blank to use base price
            </p>
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
              Current Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="stock"
              min="0"
              step="0.01"
              value={stock}
              onChange={(e) => onChange('stock', e.target.value)}
              required
              placeholder="0.00"
              className="mt-1 block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition"
            />
            <p className="mt-1 text-xs text-gray-500">
              Stock in {unit || 'selected unit'} (supports decimals)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          {isEditing && (
            <Button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              variant="secondary"
            >
              Cancel Edit
            </Button>
          )}
          <Button type="submit" loading={isLoading}>
            <FaPlusCircle className="mr-2 h-4 w-4" />
            {isEditing ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;
