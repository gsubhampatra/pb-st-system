import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiEye, FiPrinter, FiPlus, FiDownload } from 'react-icons/fi';
import { format } from 'date-fns';
import { api, API_PATHS } from '../../api';
import * as XLSX from 'xlsx';
import ReceiptForm from './ReceiptForm';
import ReceiptDetail from './ReceiptDetail';

const ReceiptTable = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [filters, setFilters] = useState({
    customerNameOrPhone: '',
    startDate: '',
    endDate: '',
    method: '',
    page: 1,
    limit: 10
  });

  // Fetch receipts with filtering and pagination
  const { data: receiptsData, isLoading, isError } = useQuery({
    queryKey: ['receipts', filters],
    queryFn: async () => {
      // Construct query parameters
      const params = new URLSearchParams();
      if (filters.customerNameOrPhone) params.append('customerNameOrPhone', filters.customerNameOrPhone);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.method) params.append('method', filters.method);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      
      const response = await api.get(`${API_PATHS.receipts.getAll}?${params.toString()}`);
      return response.data;
    }
  });

  // Delete receipt mutation
  const deleteReceipt = useMutation({
    mutationFn: (id) => api.delete(API_PATHS.receipts.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries(['receipts']);
      queryClient.invalidateQueries(['accounts']); // Refresh accounts as balance might change
      queryClient.invalidateQueries(['customers']); // Refresh customers as credit might change
    },
    onError: (error) => {
      console.error('Error deleting receipt:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to delete receipt'}`);
    }
  });

  // Open receipt details modal
  const handleViewDetail = (receipt) => {
    setSelectedReceipt(receipt);
    setIsDetailOpen(true);
  };

  // Handle print receipt
  const handlePrint = (receipt) => {
    setSelectedReceipt(receipt);
    setIsDetailOpen(true);
    // The detail modal has print functionality
  };

  // Open form to edit receipt
  const handleEdit = (receipt) => {
    setSelectedReceipt(receipt);
    setIsFormOpen(true);
  };

  // Handle delete receipt
  const handleDelete = (receipt) => {
    if (window.confirm(`Are you sure you want to delete this receipt of $${receipt.amount.toFixed(2)} from ${receipt.customer?.name}?`)) {
      deleteReceipt.mutate(receipt.id);
    }
  };

  // Handle form close
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedReceipt(null);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (!receiptsData || !receiptsData.data || receiptsData.data.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for export
    const exportData = receiptsData.data.map(receipt => ({
      'Date': format(new Date(receipt.date), 'MM/dd/yyyy'),
      'Customer': receipt.customer?.name || 'N/A',
      'Amount': receipt.amount.toFixed(2),
      'Method': receipt.method.toUpperCase(),
      'Account': receipt.method === 'account' && receipt.account 
        ? `${receipt.account.bankName} - ${receipt.account.accountNumber}` 
        : 'N/A',
      'Note': receipt.note || ''
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts');

    // Generate filename with date
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd');
    let filename = `Receipts_${dateStr}`;

    // Add filter info to filename
    if (filters.customerNameOrPhone) filename += `_Customer-${filters.customerNameOrPhone}`;
    if (filters.startDate) filename += `_From-${filters.startDate}`;
    if (filters.endDate) filename += `_To-${filters.endDate}`;
    if (filters.method) filename += `_${filters.method}`;

    // Set column widths
    const wscols = [
      { wch: 12 }, // Date
      { wch: 25 }, // Customer
      { wch: 10 }, // Amount
      { wch: 10 }, // Method
      { wch: 30 }, // Account
      { wch: 40 }, // Note
    ];
    worksheet['!cols'] = wscols;

    // Export
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 })); // Reset to page 1 when changing filters
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      customerNameOrPhone: '',
      startDate: '',
      endDate: '',
      method: '',
      page: 1,
      limit: 10
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Receipt Management</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportToExcel}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={!receiptsData || receiptsData.data.length === 0}
          >
            <FiDownload className="mr-2" />
            Export to Excel
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <FiPlus className="mr-2" />
            New Receipt
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <input
              type="text"
              name="customerNameOrPhone"
              placeholder="Name or Phone"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.customerNameOrPhone}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
            <select
              name="method"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={filters.method}
              onChange={handleFilterChange}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="account">Account</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loading and Error States */}
      {isLoading && <div className="text-center py-8">Loading receipts...</div>}
      {isError && <div className="text-center py-8 text-red-500">Error loading receipts</div>}

      {/* Receipts Table */}
      {!isLoading && !isError && receiptsData && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receiptsData.data.length > 0 ? (
                  receiptsData.data.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(receipt.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {receipt.customer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${receipt.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {receipt.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {receipt.method === 'account' && receipt.account
                          ? `${receipt.account.bankName} - ${receipt.account.accountNumber.substring(receipt.account.accountNumber.length - 4)}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                        <button
                          onClick={() => handleViewDetail(receipt)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handlePrint(receipt)}
                          className="text-purple-600 hover:text-purple-800"
                          title="Print Receipt"
                        >
                          <FiPrinter />
                        </button>
                        <button
                          onClick={() => handleEdit(receipt)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(receipt)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No receipts found matching the filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && receiptsData?.pagination?.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow">
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1}
              className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, receiptsData.pagination.totalPages) }).map((_, index) => {
              let pageNum;
              const totalPages = receiptsData.pagination.totalPages;
              const currentPage = filters.page;
              
              // Logic to show current page and surrounding pages, with ellipsis for many pages
              if (totalPages <= 5) {
                pageNum = index + 1;
              } else if (currentPage <= 3) {
                pageNum = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + index;
              } else {
                pageNum = currentPage - 2 + index;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 border border-gray-300 ${
                    pageNum === currentPage
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === receiptsData.pagination.totalPages}
              className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Receipt Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedReceipt ? 'Edit Receipt' : 'Add New Receipt'}
                </h2>
                <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>
              <ReceiptForm
                receipt={selectedReceipt}
                onSuccess={handleCloseForm}
              />
            </div>
          </div>
        </div>
      )}

      {/* Receipt Detail Modal */}
      {isDetailOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-y-auto max-h-[90vh]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Receipt Details
                </h2>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              <ReceiptDetail receiptId={selectedReceipt.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptTable;