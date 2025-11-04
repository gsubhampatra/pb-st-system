import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { useState } from 'react';
import { api, API_PATHS } from '../../api';
import SupplierForm from './SupplierForm';
import { useToast } from '../../contexts/ToastContext';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';

const SupplierTable = () => {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: suppliers = [], isLoading, isError, error } = useQuery({
    queryKey: ['suppliers', searchTerm],
    queryFn: async () => {
      const resp = await api.get(API_PATHS.suppliers.getAll, { params: { search: searchTerm } });
      return resp.data;
    }
  });

  const deleteSupplier = useMutation({
    mutationFn: (id) => api.delete(API_PATHS.suppliers.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      notify('Supplier deleted successfully', { type: 'success' });
    },
    onError: (error) => {
      notify(error.message || 'Failed to delete supplier', { type: 'error' });
    }
  });

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSupplier(null);
  };

  const handleDelete = (supplier) => {
    if (window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
      deleteSupplier.mutate(supplier.id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Supplier Management</h1>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center">
          <FiPlus className="mr-2" /> Add Supplier
        </Button>
      </div>

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search suppliers by name or phone..." 
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="font-semibold">Error loading suppliers</p>
          <p className="text-sm">{error?.message || 'Something went wrong'}</p>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                    <button 
                      onClick={() => handleEdit(s)} 
                      className="text-green-600 hover:text-green-800 transition-colors" 
                      title="Edit"
                      disabled={deleteSupplier.isPending}
                    >
                      <FiEdit />
                    </button>
                    <button 
                      onClick={() => handleDelete(s)} 
                      className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50" 
                      title="Delete"
                      disabled={deleteSupplier.isPending}
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {suppliers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No suppliers found matching your search' : 'No suppliers yet. Click "Add Supplier" to get started.'}
            </div>
          )}
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
                <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <SupplierForm supplier={selectedSupplier} onSuccess={handleCloseForm} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierTable;
