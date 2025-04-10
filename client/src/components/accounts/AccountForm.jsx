import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_PATHS , api } from '../../api';

const AccountForm = ({ account, onSuccess, onCancel }) => {
    const initialFormState = {
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        balance: 0
    };

    const [formData, setFormData] = useState(initialFormState);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();

    // Initialize form with account data if editing
    useEffect(() => {
        if (account) {
            setFormData({
                bankName: account.bankName || '',
                accountNumber: account.accountNumber || '',
                accountHolder: account.accountHolder || '',
                balance: account.balance || 0
            });
        } else {
            setFormData(initialFormState);
        }
    }, [account]);

    // Create or update account mutation
    const saveAccount = useMutation({
        mutationFn: async (data) => {
            if (account) {
                // Updating existing account - balance cannot be directly updated
                const { balance, ...updateData } = data;
                return api.put(API_PATHS.accounts.update(account.id), updateData);
            } else {
                // Creating new account
                return api.post(API_PATHS.accounts.create, data);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['accounts']);
            onSuccess();
            setFormData(initialFormState);
        },
        onError: (error) => {
            console.error('Error saving account:', error);
            // Handle specific error messages from the API if available
            if (error.response?.data?.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('An error occurred while saving the account. Please try again.');
            }
        },
        onSettled: () => {
            setIsSubmitting(false);
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        let parsedValue = value;
        
        // Parse number fields
        if (name === 'balance') {
            parsedValue = value === '' ? 0 : parseFloat(value);
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: parsedValue
        }));
        
        // Clear error when field is modified
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const validate = () => {
        const newErrors = {};
        
        if (!formData.bankName.trim()) {
            newErrors.bankName = 'Bank name is required';
        }
        
        if (!formData.accountNumber.trim()) {
            newErrors.accountNumber = 'Account number is required';
        }
        
        if (!formData.accountHolder.trim()) {
            newErrors.accountHolder = 'Account holder name is required';
        }
        
        if (isNaN(formData.balance)) {
            newErrors.balance = 'Balance must be a number';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validate()) return;
        
        setIsSubmitting(true);
        saveAccount.mutate(formData);
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {account ? 'Edit Account' : 'Add New Account'}
            </h2>
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bank Name */}
                    <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                            Bank Name
                        </label>
                        <input
                            type="text"
                            id="bankName"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            className={`mt-1 block w-full border ${errors.bankName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.bankName && (
                            <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                        )}
                    </div>

                    {/* Account Number */}
                    <div>
                        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                            Account Number
                        </label>
                        <input
                            type="text"
                            id="accountNumber"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            className={`mt-1 block w-full border ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.accountNumber && (
                            <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                        )}
                    </div>

                    {/* Account Holder */}
                    <div>
                        <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">
                            Account Holder Name
                        </label>
                        <input
                            type="text"
                            id="accountHolder"
                            name="accountHolder"
                            value={formData.accountHolder}
                            onChange={handleChange}
                            className={`mt-1 block w-full border ${errors.accountHolder ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        />
                        {errors.accountHolder && (
                            <p className="mt-1 text-sm text-red-600">{errors.accountHolder}</p>
                        )}
                    </div>

                    {/* Initial Balance - Only editable for new accounts */}
                    <div>
                        <label htmlFor="balance" className="block text-sm font-medium text-gray-700">
                            {account ? 'Current Balance (Not Editable)' : 'Initial Balance'}
                        </label>
                        <input
                            type="number"
                            id="balance"
                            name="balance"
                            step="0.01"
                            value={formData.balance}
                            onChange={handleChange}
                            disabled={!!account} // Disable if editing
                            className={`mt-1 block w-full border ${errors.balance ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${account ? 'bg-gray-100' : ''}`}
                        />
                        {errors.balance && (
                            <p className="mt-1 text-sm text-red-600">{errors.balance}</p>
                        )}
                        {account && (
                            <p className="mt-1 text-xs text-gray-500">
                                Note: Balance can only be changed through payments and receipts.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AccountForm;