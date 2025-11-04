// PrintButton.jsx
import React from 'react';
import { api, API_PATHS } from '../api';
import { useToast } from '../contexts/ToastContext';

export default function PrintButton({ data }) {
    const { notify } = useToast();

    const handlePrint = async () => {
        try {
            const { invoiceNo, date, supplier, items, totalAmount, paidAmount } = data;
            const res = await api.post(
                API_PATHS.print.printInvoice,
                { invoiceNo, date, supplier: supplier.name, items, totalAmount, paidAmount }
            );
            // axios returns data directly on res.data
            if (res?.data?.status === 'success') {
                notify('Printed successfully!', { type: 'success' });
            } else {
                notify('Printing failed', { type: 'error' });
            }
        } catch (error) {
            console.error(error);
            notify('Could not connect to printer server.', { type: 'error' });
        }
    };

    return (
        <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
            onClick={handlePrint}
            title="Print"
        >
            🖨️
        </button>
    );
}
