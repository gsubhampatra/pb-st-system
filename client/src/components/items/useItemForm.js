import { useState } from 'react';

const initialFormState = {
  name: '',
  category: '',
  unit: 'kg', // Default to 'kg'
  basePrice: '',
  sellingPrice: '',
  stock: '',
};

export const useItemForm = () => {
  const [editItemId, setEditItemId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formError) {
      setFormError('');
    }
  };

  const resetForm = () => {
    setEditItemId(null);
    setFormData(initialFormState);
    setFormError('');
  };

  const loadItemForEdit = (item) => {
    setEditItemId(item.id);
    setFormData({
      name: item.name,
      category: item.category || '',
      unit: item.unit || 'kg', // Default to 'kg'
      basePrice: String(item.basePrice),
      sellingPrice: String(item.sellingPrice),
      stock: String(item.stock),
    });
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    const { name, unit, basePrice, sellingPrice, stock } = formData;

    if (!name?.trim() || !unit?.trim() || !basePrice || !stock) {
      setFormError('Please fill in all required fields.');
      return false;
    }

    const priceBase = parseFloat(basePrice);
    const priceSelling = parseFloat(sellingPrice);
    const stockNum = parseFloat(stock);

    if (isNaN(priceBase) || priceBase < 0) {
      setFormError('Please enter a valid non-negative Base Price.');
      return false;
    }
    if (sellingPrice && (isNaN(priceSelling) || priceSelling < 0)) {
      setFormError('Please enter a valid non-negative Selling Price.');
      return false;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError('Please enter a valid non-negative Stock.');
      return false;
    }

    return true;
  };

  const getItemData = () => {
    return {
      name: formData.name.trim(),
      category: formData.category.trim() || null,
      unit: formData.unit.trim(),
      basePrice: parseFloat(formData.basePrice),
      sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
      stock: parseFloat(formData.stock),
    };
  };

  return {
    editItemId,
    formData,
    formError,
    setFormError,
    handleChange,
    resetForm,
    loadItemForEdit,
    validateForm,
    getItemData,
    isEditing: !!editItemId,
  };
};
