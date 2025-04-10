import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import AccountTable from './AccountTable';
import AccountForm from './AccountForm';
import AccountDetail from './AccountDetail';

const AccountsPage = () => {
    const [view, setView] = useState('list'); // 'list', 'add', 'edit', 'detail'
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [selectedAccountId, setSelectedAccountId] = useState(null);
    
    const handleAddClick = () => {
        setSelectedAccount(null);
        setView('add');
    };
    
    const handleEditClick = (account) => {
        setSelectedAccount(account);
        setView('edit');
    };
    
    const handleViewDetails = (accountId) => {
        setSelectedAccountId(accountId);
        setView('detail');
    };
    
    const handleFormSuccess = () => {
        setView('list');
        setSelectedAccount(null);
    };
    
    const handleFormCancel = () => {
        setView('list');
        setSelectedAccount(null);
    };
    
    const handleBackToList = () => {
        setView('list');
        setSelectedAccountId(null);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                {view === 'list' && (
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-800">Bank Accounts Management</h1>
                        <button
                            onClick={handleAddClick}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <FiPlus className="mr-2" />
                            Add New Account
                        </button>
                    </div>
                )}
            </div>

            {view === 'list' && (
                <AccountTable 
                    onEdit={handleEditClick}
                    onViewDetails={handleViewDetails}
                />
            )}

            {(view === 'add' || view === 'edit') && (
                <AccountForm
                    account={selectedAccount}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            )}

            {view === 'detail' && (
                <AccountDetail
                    accountId={selectedAccountId}
                    onBack={handleBackToList}
                />
            )}
        </div>
    );
};

export default AccountsPage;