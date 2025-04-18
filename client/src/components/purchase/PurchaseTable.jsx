import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiEye, FiPrinter, FiPlus, FiDownload } from 'react-icons/fi';
import { useState } from 'react';
import EditPurchaseForm from './EditPurchaseForm';
import PurchaseDetail from './PurchaseDetail';
import { format } from 'date-fns';
import { api, API_PATHS } from '../../api';
import * as XLSX from 'xlsx';

const PurchaseTable = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [filters, setFilters] = useState({
        supplierNameORPhone: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        status: '',
        page: 1,
        limit: 10
    });

    // Fetch purchases with filtering and pagination
    const { data: purchasesData, isLoading, isError } = useQuery({
        queryKey: ['purchases', filters],
        queryFn: async () => {
            const response = await api.get(API_PATHS.purchases.getAll, {
                params: {
                    supplierNameORPhone: filters.supplierNameORPhone || undefined,
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

    // Delete purchase mutation
    const deletePurchase = useMutation({
        mutationFn: (id) => api.delete(API_PATHS.purchases.delete(id)),
        onSuccess: () => {
            queryClient.invalidateQueries(['purchases']);
        }
    });

    const handleViewDetail = (purchase) => {
        setSelectedPurchase(purchase);
        setIsDetailOpen(true);
    };

    const handlePrint = (purchase) => {
        setSelectedPurchase(purchase);
        // This will open the detail modal which has print functionality
        setIsDetailOpen(true);
    };

    const handleExportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(purchasesData.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchases');
        
        // Generate filename with date and time
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd');
        const timeStr = format(now, 'HH-mm-ss');
        
        // Add filter information to filename
        let filename = `Purchases_${dateStr}_${timeStr}`;
        
        // Add supplier name if filtered
        if (filters.supplierNameORPhone) {
            const supplierName = purchasesData.data.length > 0 && purchasesData.data[0].supplier ? 
                `_${purchasesData.data[0].supplier.name.replace(/\s+/g, '-')}` : 
                `_Supplier-${filters.supplierNameORPhone}`;
            filename += supplierName;
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
        
        // Add item count, total and paid amounts summary
        const totalItems = purchasesData.data.reduce((sum, purchase) => sum + (purchase._count?.items || 0), 0);
        const totalAmount = purchasesData.data.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
        const paidAmount = purchasesData.data.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
        
        worksheet['!cols'] = [
            { wch: 15 }, // Date
            { wch: 25 }, // Supplier
            { wch: 10 }, // Items
            { wch: 15 }, // Total
            { wch: 15 }, // Paid
            { wch: 15 }  // Status
        ];
        
        // Add summary row at the bottom
        XLSX.utils.sheet_add_aoa(worksheet, [
            ['', '', '', '', '', ''],
            ['Summary:', '', `Items: ${totalItems}`, `Total: $${totalAmount.toFixed(2)}`, `Paid: $${paidAmount.toFixed(2)}`, '']
        ], { origin: -1 });
        
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedPurchase(null);
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Purchase Management</h1>
                <button
                    onClick={handleExportToExcel}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    <FiDownload className="mr-2" />
                    Export to Excel
                </button>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                        <input
                            type="text"
                            placeholder="Supplier ID"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.supplierNameORPhone}
                            onChange={(e) => setFilters(prev => ({ ...prev, supplierNameORPhone: e.target.value }))}
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
                            supplierNameORPhone: '',
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
            {isLoading && <div className="text-center py-8">Loading purchases...</div>}
            {isError && <div className="text-center py-8 text-red-500">Error loading purchases</div>}

            {/* Purchase Table */}
            {!isLoading && !isError && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {purchasesData.data.map((purchase) => (
                                    <tr key={purchase.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(purchase.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {purchase.supplier?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {purchase._count?.items || 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${purchase.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${purchase.paidAmount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${purchase.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                purchase.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                    purchase.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {purchase.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                                            <button
                                                onClick={() => handleViewDetail(purchase)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="View Details"
                                            >
                                                <FiEye />
                                            </button>
                                            <button
                                                onClick={() => handlePrint(purchase)}
                                                className="text-purple-600 hover:text-purple-800"
                                                title="Print Bill"
                                            >
                                                <FiPrinter />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedPurchase(purchase);
                                                    setIsFormOpen(true);
                                                }}
                                                className="text-green-600 hover:text-green-800"
                                                title="Edit"
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this purchase?')) {
                                                        deletePurchase.mutate(purchase.id);
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
                    </div>
                    {purchasesData.data.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No purchases found</div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && !isError && purchasesData?.pagination?.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="inline-flex rounded-md shadow">
                        <button
                            onClick={() => handlePageChange(filters.page - 1)}
                            disabled={filters.page === 1}
                            className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, purchasesData.pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            if (purchasesData.pagination.totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (filters.page <= 3) {
                                pageNum = i + 1;
                            } else if (filters.page >= purchasesData.pagination.totalPages - 2) {
                                pageNum = purchasesData.pagination.totalPages - 4 + i;
                            } else {
                                pageNum = filters.page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-3 py-2 border-t border-b border-gray-300 bg-white text-sm font-medium ${filters.page === pageNum
                                        ? 'bg-blue-50 text-blue-600 border-blue-500'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => handlePageChange(filters.page + 1)}
                            disabled={filters.page === purchasesData.pagination.totalPages}
                            className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}

            {/* Purchase Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    {selectedPurchase ? 'Edit Purchase' : 'Add New Purchase'}
                                </h2>
                                <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700">
                                    &times;
                                </button>
                            </div>
                            <EditPurchaseForm
                                purchase={selectedPurchase}
                                onSuccess={handleCloseForm}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Purchase Detail Modal */}
            {isDetailOpen && selectedPurchase && (
                <div className="fixed inset-0 bg-transparent backdrop-blur-2xl flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    Purchase Details
                                </h2>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                            </div>
                            <PurchaseDetail purchaseId={selectedPurchase.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseTable;