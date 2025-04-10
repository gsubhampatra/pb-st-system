import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiEye, FiPlus } from 'react-icons/fi';
import { useState } from 'react';
import { api, API_PATHS } from '../../api';
import CustomerForm from './CustomerForm';
import CustomerCreditReport from './CustomerCreditReport';

const CustomerTable = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCreditReportOpen, setIsCreditReportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch customers with search functionality
  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ['customers', searchTerm],
    queryFn: async () => {
      const response = await api.get(API_PATHS.customers.getAll, {
        params: { search: searchTerm }
      });
      return response.data;
    }
  });

  // Delete customer mutation
  const deleteCustomer = useMutation({
    mutationFn: (id) => api.delete(API_PATHS.customers.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
    }
  });

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleViewCredit = (customer) => {
    setSelectedCustomer(customer);
    setIsCreditReportOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Customer Management</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" /> Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name or phone..."
          className="w-full p-2 border border-gray-300 rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading and Error States */}
      {isLoading && <div className="text-center py-8">Loading customers...</div>}
      {isError && <div className="text-center py-8 text-red-500">Error loading customers</div>}

      {/* Customer Table */}
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
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.address || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                    <button
                      onClick={() => handleViewCredit(customer)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Credit"
                    >
                      <FiEye />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-green-600 hover:text-green-800"
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this customer?')) {
                          deleteCustomer.mutate(customer.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {customers.length === 0 && (
            <div className="text-center py-8 text-gray-500">No customers found</div>
          )}
        </div>
      )}

      {/* Customer Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h2>
                <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>
              <CustomerForm 
                customer={selectedCustomer} 
                onSuccess={handleCloseForm} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Credit Report Modal */}
      {isCreditReportOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Credit Report for {selectedCustomer.name}
                </h2>
                <button 
                  onClick={() => setIsCreditReportOpen(false)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              <CustomerCreditReport customerId={selectedCustomer.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTable;