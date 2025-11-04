import React from 'react';
import ItemForm from './ItemForm';
import ItemTable from './ItemTable';
import { useItems } from './useItems';
import { useItemForm } from './useItemForm';
import { useItemMutations } from './useItemMutations';

function ItemsPage() {
  // Custom hooks
  const { items, isLoading: isLoadingItems, error: itemsError, refetch } = useItems();
  
  const {
    editItemId,
    formData,
    formError,
    setFormError,
    handleChange,
    resetForm,
    loadItemForEdit,
    validateForm,
    getItemData,
    isEditing,
  } = useItemForm();

  const {
    createItem,
    updateItem,
    deleteItem,
    isCreating,
    isUpdating,
    isDeleting,
  } = useItemMutations(resetForm, editItemId, setFormError);

  // --- Handle Form Submit ---
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const itemData = getItemData();

    if (editItemId) {
      updateItem.mutate({ ...itemData, id: editItemId });
    } else {
      createItem.mutate(itemData);
    }
  };

  // --- Handle Delete Click ---
  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      deleteItem.mutate(item.id);
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Manage Items</h1>

      <div className="mb-8">
        <ItemForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          formError={formError}
          isLoading={isLoading}
          isEditing={isEditing}
        />
      </div>

      <ItemTable
        items={items}
        isLoading={isLoadingItems}
        error={itemsError}
        onEdit={loadItemForEdit}
        onDelete={handleDelete}
        onRetry={refetch}
        isActionDisabled={isDeleting || isUpdating || isCreating}
      />
    </div>
  );
}

export default ItemsPage;