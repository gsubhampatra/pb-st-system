import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FiDollarSign, FiCreditCard, FiCalendar, FiUser, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { API_PATHS ,api } from '../../api';

const AccountDetail = ({ accountId, onBack }) => {
    const [activeTab, setActiveTab] = useState('payments');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [transactionPage, setTransactionPage] = useState(1);

    // Fetch account details
    const { data: account, isLoading: accountLoading, isError: accountError } = useQuery({
        queryKey: ['account', accountId],
        queryFn: async () => {
            const response = await api.get(API_PATHS.accounts.getById(accountId));
            return response.data;
        },
        enabled: !!accountId
    });

    // Fetch account payments
    const { data: paymentsData, isLoading: paymentsLoading, isError: paymentsError } = useQuery({
        queryKey: ['accountPayments', accountId, transactionPage, dateRange, activeTab === 'payments'],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', transactionPage);
            params.append('limit', 10);
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);
            
            const response = await api.get(`${API_PATHS.accounts.getPayments(accountId)}?${params.toString()}`);
            return response.data;
        },
        enabled: !!accountId && activeTab === 'payments'
    });

    // Fetch account receipts
    const { data: receiptsData, isLoading: receiptsLoading, isError: receiptsError } = useQuery({
        queryKey: ['accountReceipts', accountId, transactionPage, dateRange, activeTab === 'receipts'],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', transactionPage);
            params.append('limit', 10);
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);
            
            const response = await api.get(`${API_PATHS.accounts.getReceipts(accountId)}?${params.toString()}`);
            return response.data;
        },
        enabled: !!accountId && activeTab === 'receipts'
    });

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
        setTransactionPage(1); // Reset to first page when filters change
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setTransactionPage(1); // Reset to first page when changing tabs
    };

    const handlePageChange = (newPage) => {
        setTransactionPage(newPage);
    };

    if (accountLoading) {
        return <div className="text-center py-8">Loading account details...</div>;
    }

    if (accountError) {
        return <div className="text-center py-8 text-red-500">Error loading account details</div>;
    }

    if (!account) {
        return <div className="text-center py-8">Account not found</div>;
    }

    const transactionsData = activeTab === 'payments' ? paymentsData : receiptsData;
    const isTransactionsLoading = activeTab === 'payments' ? paymentsLoading : receiptsLoading;
    const hasTransactionsError = activeTab === 'payments' ? paymentsError : receiptsError;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Account Details</h2>
                <button
                    onClick={onBack}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Back to Accounts
                </button>
            </div>

            {/* Account Summary */}
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FiCreditCard className="text-blue-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Bank</p>
                                <p className="text-xl font-semibold text-gray-900">{account.bankName}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FiUser className="text-purple-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Account Holder</p>
                                <p className="text-xl font-semibold text-gray-900">{account.accountHolder}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                            <FiDollarSign className="text-green-500 text-2xl mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Account Number</p>
                                <p className="text-xl font-semibold text-gray-900">{account.accountNumber}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${account.balance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-center">
                            {account.balance >= 0 ? (
                                <FiArrowUp className="text-green-500 text-2xl mr-3" />
                            ) : (
                                <FiArrowDown className="text-red-500 text-2xl mr-3" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-500">Current Balance</p>
                                <p className={`text-xl font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${Math.abs(account.balance).toFixed(2)}
                                    {account.balance < 0 && ' (Negative)'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction History</h3>
                
                {/* Tabs */}
                <div className="flex border-b mb-4">
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => handleTabChange('payments')}
                    >
                        Payments (Money Out)
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'receipts' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => handleTabChange('receipts')}
                    >
                        Receipts (Money In)
                    </button>
                </div>
                
                {/* Date Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                            From Date
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            value={dateRange.startDate}
                            onChange={handleDateChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                            To Date
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            name="endDate"
                            value={dateRange.endDate}
                            onChange={handleDateChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
                
                {/* Transaction Table */}
                {isTransactionsLoading ? (
                    <div className="text-center py-8">Loading transactions...</div>
                ) : hasTransactionsError ? (
                    <div className="text-center py-8 text-red-500">Error loading transactions</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {activeTab === 'payments' ? 'Supplier' : 'Customer'}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactionsData?.data?.length > 0 ? transactionsData.data.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {activeTab === 'payments' 
                                                ? transaction.supplier?.name || 'N/A'
                                                : transaction.customer?.name || 'N/A'
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={activeTab === 'payments' ? 'text-red-600' : 'text-green-600'}>
                                                {activeTab === 'payments' ? '-' : '+'}${transaction.amount.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {transaction.note || 'No note'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No {activeTab} found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Pagination */}
                {!isTransactionsLoading && !hasTransactionsError && transactionsData?.pagination?.totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <nav className="inline-flex rounded-md shadow">
                            <button
                                onClick={() => handlePageChange(transactionPage - 1)}
                                disabled={transactionPage === 1}
                                className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, transactionsData.pagination.totalPages) }, (_, i) => {
                                let pageNum;
                                const totalPages = transactionsData.pagination.totalPages;
                                
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else {
                                    if (transactionPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (transactionPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = transactionPage - 2 + i;
                                    }
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-2 border border-gray-300 text-sm font-medium ${
                                            transactionPage === pageNum
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handlePageChange(transactionPage + 1)}
                                disabled={transactionPage === transactionsData.pagination.totalPages}
                                className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccountDetail;