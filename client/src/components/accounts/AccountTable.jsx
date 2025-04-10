import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiEye, FiDownload } from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { API_PATHS, api } from '../../api';

const AccountTable = ({ onEdit, onViewDetails }) => {
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        limit: 10
    });

    const queryClient = useQueryClient();

    // Fetch accounts data
    const { data: accountsData, isLoading, isError } = useQuery({
        queryKey: ['accounts', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            params.append('page', filters.page);
            params.append('limit', filters.limit);
            
            const response = await api.get(`${API_PATHS.accounts.getAll}?${params.toString()}`);
            return response.data;
        }
    });

    // Delete account mutation
    const deleteAccount = useMutation({
        mutationFn: async (id) => {
            return api.delete(API_PATHS.accounts.delete(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['accounts']);
        }
    });

    const handleDeleteClick = (id, balance) => {
        if (balance !== 0) {
            alert('Cannot delete an account with a non-zero balance. Please adjust the balance first.');
            return;
        }

        if (window.confirm('Are you sure you want to delete this account?')) {
            deleteAccount.mutate(id);
        }
    };

    const handleSearchChange = (e) => {
        setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleExportToExcel = () => {
        if (!accountsData?.data || accountsData.data.length === 0) return;
        
        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        
        // Format data for excel
        const excelData = accountsData.data.map(account => ({
            'Bank': account.bankName,
            'Account Number': account.accountNumber,
            'Account Holder': account.accountHolder,
            'Balance': account.balance.toFixed(2),
            'Payments Count': account._count?.payments || 0,
            'Receipts Count': account._count?.receipts || 0
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 }, // Bank
            { wch: 20 }, // Account Number
            { wch: 25 }, // Account Holder
            { wch: 15 }, // Balance
            { wch: 15 }, // Payments
            { wch: 15 }  // Receipts
        ];
        
        // Calculate totals
        const totalBalance = accountsData.data.reduce((sum, account) => sum + account.balance, 0);
        
        // Add summary row
        XLSX.utils.sheet_add_aoa(worksheet, [
            ['', '', '', '', '', ''],
            ['Summary:', '', '', `Total Balance: $${totalBalance.toFixed(2)}`, '', '']
        ], { origin: -1 });
        
        // Add to workbook and download
        let filename = 'Accounts_Report';
        
        // Add search term if filtered
        if (filters.search) {
            filename += `_Search-${filters.search}`;
        }
        
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div className="w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Search accounts..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.search}
                        onChange={handleSearchChange}
                    />
                </div>
                <button
                    onClick={handleExportToExcel}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    <FiDownload className="mr-2" />
                    Export to Excel
                </button>
            </div>

            {/* Loading and error states */}
            {isLoading && <div className="text-center py-8">Loading accounts...</div>}
            {isError && <div className="text-center py-8 text-red-500">Error loading accounts</div>}

            {/* Accounts Table */}
            {!isLoading && !isError && (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Holder</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {accountsData?.data?.length > 0 ? accountsData.data.map((account) => (
                                    <tr key={account.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {account.bankName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {account.accountNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {account.accountHolder}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={account.balance >= 0 ? "text-green-600" : "text-red-600"}>
                                                ${account.balance.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => onViewDetails(account.id)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <FiEye />
                                                </button>
                                                <button
                                                    onClick={() => onEdit(account)}
                                                    className="text-yellow-600 hover:text-yellow-900"
                                                    title="Edit"
                                                >
                                                    <FiEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(account.id, account.balance)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No accounts found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!isLoading && !isError && accountsData?.pagination?.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="inline-flex rounded-md shadow">
                        <button
                            onClick={() => handlePageChange(filters.page - 1)}
                            disabled={filters.page === 1}
                            className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, accountsData.pagination.totalPages) }, (_, i) => {
                            let pageNum;
                            const totalPages = accountsData.pagination.totalPages;
                            const currentPage = filters.page;
                            
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else {
                                if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                            }
                            
                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`px-3 py-2 border border-gray-300 text-sm font-medium ${
                                        currentPage === pageNum
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => handlePageChange(filters.page + 1)}
                            disabled={filters.page === accountsData.pagination.totalPages}
                            className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default AccountTable;