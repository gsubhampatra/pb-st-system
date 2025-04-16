// PrintButton.jsx
import React from 'react';
import { api, API_PATHS } from '../api';

export default function PrintButton({ data }) {
    const handlePrint = async () => {
        try {
            const { invoiceNo, date, supplier, items, totalAmount, paidAmount } = data;
            const res = await api.post(API_PATHS.print.printInvoice, { invoiceNo, date, supplier: supplier.name, items, totalAmount, paidAmount });

            const result = await res.json();
            if (result.status === 'success') {
                alert('Printed successfully!');
            } else {
                alert('Printing failed');
            }
        } catch (error) {
            console.error(error);
            alert('Could not connect to printer server.');
        }
    };

    return <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded' onClick={handlePrint}>🖨️</button>;
}
