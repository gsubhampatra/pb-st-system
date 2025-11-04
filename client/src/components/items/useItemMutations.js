import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { useToast } from '../../contexts/ToastContext';

export const useItemMutations = (resetForm, editItemId, setFormError) => {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  // Create Item Mutation
  const createItem = useMutation({
    mutationFn: (newItemData) => api.post(API_PATHS.items.create, newItemData),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
      resetForm();
      notify('Item created successfully!', { type: 'success' });
    },
    onError: (error) => {
      const message = error.message || 'Failed to create item';
      setFormError(message);
      notify(message, { type: 'error' });
    },
  });

  // Update Item Mutation
  const updateItem = useMutation({
    mutationFn: (itemData) => api.put(API_PATHS.items.update(itemData.id), itemData),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
      resetForm();
      notify('Item updated successfully!', { type: 'success' });
    },
    onError: (error) => {
      const message = error.message || 'Failed to update item';
      setFormError(message);
      notify(message, { type: 'error' });
    },
  });

  // Delete Item Mutation
  const deleteItem = useMutation({
    mutationFn: (itemId) => api.delete(API_PATHS.items.delete(itemId)),
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries(['items']);
      notify('Item deleted successfully!', { type: 'success' });
      if (editItemId === itemId) {
        resetForm();
      }
    },
    onError: (error) => {
      notify(error.message || 'Failed to delete item', { type: 'error' });
    },
  });

  return {
    createItem,
    updateItem,
    deleteItem,
    isCreating: createItem.isPending,
    isUpdating: updateItem.isPending,
    isDeleting: deleteItem.isPending,
  };
};
