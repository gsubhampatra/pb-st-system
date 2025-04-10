import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiEye, FiPrinter, FiPlus, FiDownload } from 'react-icons/fi';
import { useState } from 'react';
import { format } from 'date-fns';
import { api, API_PATHS } from '../../api';
import * as XLSX from 'xlsx';
import PaymentForm from './PaymentForm';
import PaymentDetail from './PaymentDetail';

const PaymentTable = () => {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [filters, setFilters] = useState({
        supplierNameORPhone: '',
        accountId: '',
        method: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        page: 1,
        limit: 10
    });

    // Fetch payments with filtering and pagination
    const { data: paymentsData, isLoading, isError } = useQuery({
        queryKey: ['payments', filters],
        queryFn: async () => {
            const response = await api.get(API_PATHS.payments.getAll, {
                params: {
                    supplierNameORPhone: filters.supplierNameORPhone || undefined,
                    accountId: filters.accountId || undefined,
                    method: filters.method || undefined,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                    page: filters.page,
                    limit: filters.limit
                }
            });
            return response.data;
        }
    });

    // Fetch accounts for filtering
    const { data: accounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const response = await api.get(API_PATHS.accounts.getAll);
            return response.data.data;
        }
    });

    // Delete payment mutation
    const deletePayment = useMutation({
        mutationFn: (id) => api.delete(API_PATHS.payments.delete(id)),
        onSuccess: () => {
            queryClient.invalidateQueries(['payments']);
            queryClient.invalidateQueries(['accounts']); // Refresh accounts as balance might change
        }
    });

    const handleViewDetail = (payment) => {
        setSelectedPayment(payment);
        setIsDetailOpen(true);
    };

    const handleExportToExcel = () => {
        if (!paymentsData?.data) return;
        
        const worksheet = XLSX.utils.json_to_sheet(paymentsData.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
        
        // Generate filename with date and time
        const now = new Date();
        const dateStr = format(now, 'yyyy-MM-dd');
        const timeStr = format(now, 'HH-mm-ss');
        
        // Add filter information to filename
        let filename = `Payments_${dateStr}_${timeStr}`;
        
        // Add supplier name if filtered
        if (filters.supplierNameORPhone) {
            filename += `_Supplier-${filters.supplierNameORPhone}`;
        }
        
        // Add date range if specified
        if (filters.startDate) {
            filename += `_from-${filters.startDate}`;
        }
        if (filters.endDate) {
            filename += `_to-${filters.endDate}`;
        }
        
        // Add method if filtered
        if (filters.method) {
            filename += `_${filters.method}`;
        }
        
        // Add column widths
        worksheet['!cols'] = [
            { wch: 15 }, // Date
            { wch: 25 }, // Supplier
            { wch: 15 }, // Amount
            { wch: 15 }, // Method
            { wch: 25 }, // Account
            { wch: 20 }, // Note
            { wch: 15 }  // Status
        ];
        
        // Add summary row at the bottom
        const totalAmount = paymentsData.data.reduce((sum, payment) => sum + payment.amount, 0);
        
        XLSX.utils.sheet_add_aoa(worksheet, [
            ['', '', '', '', '', ''],
            ['Summary:', '', `Total Paid: $${totalAmount.toFixed(2)}`, '', '', '']
        ], { origin: -1 });
        
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedPayment(null);
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
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
                            placeholder="Supplier Name/Phone"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.method}
                            onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                        >
                            <option value="">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="account">Bank Account</option>
                        </select>
                    </div>
                    {filters.method === 'account' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                            <select
                                className="w-full p-2 border border-gray-300 rounded-md"
                                value={filters.accountId}
                                onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                            >
                                <option value="">All Accounts</option>
                                {accounts?.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.bankName} - {account.accountNumber}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Add New Payment Button */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => {
                        setSelectedPayment(null);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    <FiPlus className="mr-2" />
                    Add New Payment
                </button>
            </div>

            {/* Loading and Error States */}
            {isLoading && <div className="text-center py-8">Loading payments...</div>}
            {isError && <div className="text-center py-8 text-red-500">Error loading payments</div>}

            {/* Payment Table */}
            {!isLoading && !isError && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paymentsData?.data?.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(payment.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.supplier?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                            ${payment.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {payment.method}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.method === 'account' && payment.account 
                                                ? `${payment.account.bankName} - {payment.account.accountNumber}` 
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.note || 'No note'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                                            <button
                                                onClick={() => handleViewDetail(payment)}
                                                className="text-blue-600 hover:text-blue-800"
                                                title="View Details"
                                            >
                                                <FiEye />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedPayment(payment);
                                                    setIsFormOpen(true);
                                                }}
                                                className="text-green-600 hover:text-green-800"
                                                title="Edit"
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this payment? This will reverse any account balance changes.')) {
                                                        deletePayment.mutate(payment.id);
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
                    {paymentsData?.data?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">No payments found</div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {paymentsData?.pagination && paymentsData.pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="flex">
                        <button
                            onClick={() => handlePageChange(filters.page - 1)}
                            disabled={filters.page === 1}
                            className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {[...Array(Math.min(5, paymentsData.pagination.totalPages))].map((_, i) => {
                            let pageNum;
                            // Logic to decide which set of pages to show
                            if (filters.page <= 3) {
                                pageNum = i + 1;
                            } else if (filters.page >= paymentsData.pagination.totalPages - 2) {
                                pageNum = paymentsData.pagination.totalPages - 4 + i;
                            } else {
                                pageNum = filters.page - 2 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-3 py-2 border border-gray-300 text-sm font-medium ${
                                        pageNum === filters.page
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
                            disabled={filters.page === paymentsData.pagination.totalPages}
                            className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}

            {/* Payment Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    {selectedPayment ? 'Edit Payment' : 'Add New Payment'}
                                </h2>
                                <button onClick={handleCloseForm} className="text-gray-500 hover:text-gray-700">
                                    &times;
                                </button>
                            </div>
                            <PaymentForm
                                payment={selectedPayment}
                                onSuccess={handleCloseForm}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Detail Modal */}
            {isDetailOpen && selectedPayment && (
                <div className="fixed inset-0 bg-transparent backdrop-blur-2xl flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    Payment Details
                                </h2>
                                <button
                                    onClick={() => setIsDetailOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    &times;
                                </button>
                            </div>
                            <PaymentDetail paymentId={selectedPayment.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentTable;