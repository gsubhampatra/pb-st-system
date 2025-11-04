import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit, FiTrash2, FiEye, FiPrinter, FiPlus, FiDownload, FiFilter } from 'react-icons/fi';
import { useState } from 'react';
import EditPurchaseForm from './EditPurchaseForm';
import PurchaseDetail from './PurchaseDetail';
import { format } from 'date-fns';
import { api, API_PATHS } from '../../api';
import SearchableSelect from './ui/SearchableSelect';
import { useSuppliers } from '../../contexts/SupplierContext';

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

    const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    const prettyStatus = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

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


    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedPurchase(null);
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    // Report download filters
    const { suppliers: suppliersData, isLoading: isLoadingSuppliers, setSearchTerm: setSupplierSearchTerm } = useSuppliers();
    const [reportSupplier, setReportSupplier] = useState(null);
    const [reportStartDate, setReportStartDate] = useState(new Date().toISOString().substr(0, 16)); // default to today
    const [reportEndDate, setReportEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substr(0, 16)); // default to tomorrow

    const onReportSupplierQuery = (q) => setSupplierSearchTerm(q);

    const downloadPurchaseReport = async () => {
        try {
            const params = new URLSearchParams();
            params.set('reportType', 'purchase');
            if (reportStartDate) {
                const start = new Date(reportStartDate); start.setHours(0,0,0,0);
                params.set('startDate', start.toISOString());
            }
            if (reportEndDate) {
                const end = new Date(reportEndDate); end.setHours(23,59,59,999);
                params.set('endDate', end.toISOString());
            }
            if (reportSupplier?.id) params.set('supplierId', reportSupplier.id);

            const response = await api.get(`${API_PATHS.reports.download}?${params.toString()}`,{ responseType:'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `purchase_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download purchase report:', error);
            alert(error?.response?.data?.message || 'Failed to download report');
        }
    };

    return (
        <div className="container mx-auto px-3 py-6">


            {/* Filter Section */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <FiFilter className="text-gray-500" />
                    <h2 className="text-lg font-semibold">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Supplier (name or phone)</label>
                        <input
                            type="text"
                            placeholder="e.g. Rakesh or 98xxxxxx"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.supplierNameORPhone}
                            onChange={(e) => setFilters(prev => ({ ...prev, supplierNameORPhone: e.target.value, page: 1 }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded-md"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                        >
                            <option value="">All</option>
                            <option value="recorded">Recorded</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-between mt-4 flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-500">Quick status:</span>
                        {['', 'paid', 'partial', 'cancelled'].map((s) => (
                            <button
                                key={s || 'all'}
                                onClick={() => setFilters(prev => ({ ...prev, status: s, page: 1 }))}
                                className={`px-2 py-1 rounded-full text-xs border ${filters.status === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {s ? prettyStatus(s) : 'All'}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                        <select
                            className="px-2 py-2 border border-gray-300 rounded-md text-sm"
                            value={filters.limit}
                            onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                            title="Rows per page"
                        >
                            {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
                        </select>
                        <button
                            onClick={() => setFilters({
                                supplierNameORPhone: '',
                                startDate: '',
                                endDate: '',
                                status: '',
                                page: 1,
                                limit: 10
                            })}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <FiFilter className="opacity-70" />
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading and Error States */}
            {isLoading && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="animate-pulse">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 border-b border-gray-200 bg-gray-50/50" />
                        ))}
                    </div>
                </div>
            )}
            {isError && <div className="text-center py-8 text-red-500">Error loading purchases</div>}

            {/* Purchase Table */}
            {!isLoading && !isError && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    {/* Download toolbar */}
                    <div className="p-4 border-b flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
                            <div>
                                <SearchableSelect
                                    label="Supplier (optional)"
                                    items={suppliersData || []}
                                    selected={reportSupplier}
                                    onSelect={setReportSupplier}
                                    onQueryChange={onReportSupplierQuery}
                                    placeholder="Type to search suppliers..."
                                    loading={isLoadingSuppliers}
                                    displayValue={(s) => s ? `${s.name}${s.phone?` (${s.phone})`:''}` : ''}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                                <input type="datetime-local" value={reportStartDate} onChange={(e)=>setReportStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" defaultValue={new Date().toISOString().substr(0, 16) + 'T00:00'} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                                <input type="datetime-local" value={reportEndDate} onChange={(e)=>setReportEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" defaultValue={new Date(Date.now() + 24*60*60*1000).toISOString().substr(0, 16) + 'T23:59'} />
                            </div>
                        </div>
                        <div className="mt-2 md:mt-0">
                            <button onClick={downloadPurchaseReport} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                                <FiDownload />
                                Download Purchase Report
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Items</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
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
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                                                {purchase._count?.items || 0}
                                                <span>items</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {inr.format(purchase.totalAmount || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {inr.format(purchase.paidAmount || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${purchase.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                purchase.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                    purchase.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                }`}>
                                                {prettyStatus(purchase.status)}
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
                        <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                            <div className="text-5xl mb-3">🧾</div>
                            <div className="font-medium">No purchases found</div>
                            <div className="text-sm">Try adjusting filters or date range.</div>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && !isError && purchasesData?.pagination?.totalPages > 1 && (
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                        Page {filters.page} of {purchasesData.pagination.totalPages}
                    </div>
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