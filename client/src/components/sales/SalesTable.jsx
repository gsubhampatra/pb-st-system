import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiEye, FiPrinter, FiPlus, FiDownload } from 'react-icons/fi';
import { useState } from 'react';
import { api, API_PATHS, addQueryParams } from '../../api';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import SaleDetail from './SaleDetail';
import SalesForm from './SalesForm';

const SalesTable = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSaleId, setSelectedSaleId] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [filters, setFilters] = useState({
        customerNameOrPhone: '',
        startDate: '',
        endDate: '',
        status: '',
        page: 1,
        limit: 10
    });

    // Fetch sales with filtering and pagination
    const { data: salesData, isLoading, isError } = useQuery({
        queryKey: ['sales', filters],
        queryFn: async () => {
            const response = await api.get(API_PATHS.sales.getAll, {
                params: {
                    customerNameOrPhone: filters.customerNameOrPhone || undefined,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                    status: filters.status || undefined,
                    page: filters.page,
                    limit: filters.limit
                }
            });
            return response.data;
        }
    });

    // Delete sale mutation
    const deleteSale = useMutation({
        mutationFn: (id) => api.delete(API_PATHS.sales.delete(id)),
        onSuccess: () => {
            queryClient.invalidateQueries(['sales']);
            alert('Sale deleted successfully');
        },
        onError: (error) => {
            console.error('Error deleting sale:', error);
            alert(`Error: ${error.response?.data?.message || 'Failed to delete sale'}`);
        }
    });

    const handleViewDetail = (sale) => {
        setSelectedSale(sale);
        setIsDetailOpen(true);
    };

    const handlePrint = (sale) => {
        setSelectedSale(sale);
        setIsDetailOpen(true);
        // The detail component will handle printing
    };

    const handleExportToExcel = () => {
        if (!salesData?.data?.length) {
            alert('No data to export');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(salesData.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');

        // Generate filename with date and time
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd');
        const timeStr = format(now, 'HH-mm-ss');

        // Add filter information to filename
        let filename = `Sales_${dateStr}_${timeStr}`;

        // Add customer name if filtered
        if (filters.customerNameOrPhone) {
            const customerName = salesData.data.length > 0 && salesData.data[0].customer ?
                `_${salesData.data[0].customer.name.replace(/\s+/g, '-')}` :
                `_Customer-${filters.customerNameOrPhone}`;
            filename += customerName;
        }

        // Add date range if specified
        if (filters.startDate) {
            filename += `_from-${filters.startDate}`;
        }
        if (filters.endDate) {
            filename += `_to-${filters.endDate}`;
        }

        // Add status if filtered
        if (filters.status) {
            filename += `_${filters.status}`;
        }

        // Add item count, total and received amounts summary
        const totalItems = salesData.data.reduce((sum, sale) => sum + (sale._count?.items || 0), 0);
        const totalAmount = salesData.data.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const receivedAmount = salesData.data.reduce((sum, sale) => sum + sale.receivedAmount, 0);

        worksheet['!cols'] = [
            { wch: 15 }, // Date
            { wch: 25 }, // Customer
            { wch: 10 }, // Items
            { wch: 15 }, // Total
            { wch: 15 }, // Received
            { wch: 15 }  // Status
        ];

        // Add summary row at the bottom
        XLSX.utils.sheet_add_aoa(worksheet, [
            ['', '', '', '', '', ''],
            ['Summary:', '', `Items: ${totalItems}`, `Total: $${totalAmount.toFixed(2)}`, `Received: $${receivedAmount.toFixed(2)}`, '']
        ], { origin: -1 });

        XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    const handleCreateNew = () => {
        setSelectedSaleId(null);
        setIsModalOpen(true);
    };

    const handleEditSale = (saleId) => {
        setSelectedSaleId(saleId);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        setSelectedSaleId(null);
    };
    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Sales Management</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportToExcel}
                        disabled={isLoading || isError || !salesData?.data?.length}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                        <FiDownload className="mr-2" />
                        Export to Excel
                    </button>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <FiPlus className="mr-2" />
                        Create New Sale
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
                            placeholder="Customer Name/Phone"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.customerNameOrPhone}
                            onChange={(e) => setFilters(prev => ({ ...prev, customerNameOrPhone: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">All</option>
                            <option value="recorded">Recorded</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={() => setFilters({
                            customerNameOrPhone: '',
                            startDate: '',
                            endDate: '',
                            status: '',
                            page: 1,
                            limit: 10
                        })}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Loading and Error States */}
            {isLoading && <div className="text-center py-8">Loading sales...</div>}
            {isError && <div className="text-center py-8 text-red-500">Error loading sales</div>}

            {/* Sales Table */}
            {!isLoading && !isError && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {salesData?.data?.length > 0 ? salesData.data.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(sale.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {sale.customer?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {sale._count?.items || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₹{sale.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ₹{sale.receivedAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sale.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                sale.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                    sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {sale.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                                            <button
                                                onClick={() => handleViewDetail(sale)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="View Details"
                                            >
                                                <FiEye />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(sale)}
                                                className="text-purple-600 hover:text-purple-800"
                                                title="Print Receipt"
                                            >
                                                <FiPrinter />
                                            </button>
                                            <button
                                                onClick={() => handleEditSale(sale.id)}
                                                className="text-green-600 hover:text-green-800"
                                                title="Edit"
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this sale? This will restore stock levels.')) {
                                                        deleteSale.mutate(sale.id);
                                                    }
                                                }}
                                                className="text-red-600 hover:text-red-800"
                                                title="Delete"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No sales found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!isLoading && !isError && salesData?.pagination?.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="inline-flex rounded-md shadow">
                        <button
                            onClick={() => handlePageChange(filters.page - 1)}
                            disabled={filters.page === 1}
                            className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, salesData.pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (salesData.pagination.totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (filters.page <= 3) {
                                pageNum = i + 1;
                            } else if (filters.page >= salesData.pagination.totalPages - 2) {
                                pageNum = salesData.pagination.totalPages - 4 + i;
                            } else {
                                pageNum = filters.page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-3 py-2 border border-gray-300 ${pageNum === filters.page ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-700'} text-sm font-medium hover:bg-gray-50`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => handlePageChange(filters.page + 1)}
                            disabled={filters.page === salesData.pagination.totalPages}
                            className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}

            {/* Edit Sale Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <SalesForm
                        saleId={selectedSaleId}
                        onSuccess={handleSuccess}
                        onClose={() => setIsModalOpen(false)}
                    />
                </div>
            )}

            {/* Sale Detail Modal */}
            {isDetailOpen && selectedSale && (
                <div className="fixed inset-0 bg-transparent backdrop-blur-2xl flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    Sale Details
                                </h2>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                            </div>
                            <SaleDetail saleId={selectedSale.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesTable;
