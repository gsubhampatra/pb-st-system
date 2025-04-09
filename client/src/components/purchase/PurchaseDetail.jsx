import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { FiPrinter } from 'react-icons/fi';
import { useRef } from 'react';
import { format } from 'date-fns';

const PurchaseDetail = ({ purchaseId }) => {
    const previewRef = useRef();

    const { data: purchase, isLoading, isError } = useQuery({
        queryKey: ['purchase', purchaseId],
        queryFn: async () => {
            const response = await api.get(API_PATHS.purchases.getById(purchaseId));
            return response.data;
        }
    });

    const handleThermalPrint = () => {
        const content = `
      <html>
        <head>
          <title>Thermal Invoice</title>
          <style>
            body {
              font-family: monospace;
              font-size: 10px;
              padding: 5px;
              margin: 0;
              width: 58mm;
            }
            h2, p {
              margin: 0;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            td, th {
              padding: 2px 0;
              text-align: left;
            }
            .right {
              text-align: right;
            }
            .line {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
          </style>
        </head>
        <body>
          <h2>PURCHASE INVOICE</h2>
          <p>Invoice #: ${purchase.id}</p>
          <p>Date: ${format(new Date(purchase.date), 'dd/MM/yyyy')}</p>
          <p>Supplier: ${purchase.supplier?.name || ''}</p>
          <p>${purchase.supplier?.phone || ''}</p>
          <div class="line"></div>
  
          <table>
            ${purchase.items
                .map(
                    (item, i) => `
              <tr>
                <td>${i + 1}. ${item.item.name.trim().split('-')[0].trim().split(' ')[0]}</td>
                <td class="right">${item.quantity} x ${item.unitPrice.toFixed(2)}</td>
                <td class="right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            `
                )
                .join('')}
          </table>
  
          <div class="line"></div>
          <table>
            <tr>
              <td>Total</td>
              <td class="right">₹${purchase.totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Paid</td>
              <td class="right">₹${purchase.paidAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Due</td>
              <td class="right">₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}</td>
            </tr>
          </table>
  
          <div class="line"></div>
          <p>Thank you!</p>
        </body>
      </html>
    `;

        const printWindow = window.open('', '', 'width=300,height=600');
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };


    const handlePrintAlternative = () => {
        const content = previewRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=600,height=800');
        printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Invoice</title>
          <style>
            body { font-family: sans-serif; font-size: 10px; padding: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 4px; text-align: left; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const generateShareMessage = () => {
        return encodeURIComponent(
            `Purchase Invoice\nSupplier: ${purchase.supplier?.name}\nDate: ${format(
                new Date(purchase.date),
                'dd/MM/yyyy'
            )}\nTotal: ₹${purchase.totalAmount.toFixed(2)}\nPaid: ₹${purchase.paidAmount.toFixed(
                2
            )}\nDue: ₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}`
        );
    };

    const handleWhatsAppShare = () => {
        const message = generateShareMessage();
        const phone = purchase.supplier?.phone?.replace(/\D/g, '');
        if (phone) {
            window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
        } else {
            alert('Supplier phone number not available');
        }
    };

    const handleSmsShare = () => {
        const message = generateShareMessage();
        const phone = purchase.supplier?.phone?.replace(/\D/g, '');
        if (phone) {
            window.open(`sms:${phone}?&body=${message}`, '_blank');
        } else {
            alert('Supplier phone number not available');
        }
    };

    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (isError) return <div className="text-center py-8 text-red-500">Error loading invoice</div>;

    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-2 justify-end no-print">
                <button
                    onClick={handlePrintAlternative}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center text-sm"
                >
                    <FiPrinter className="mr-1" /> Print Invoice
                </button>
                <button
                    onClick={handleThermalPrint}
                    className="bg-black text-white px-3 py-1 rounded-md text-sm"
                >
                    Thermal Print
                </button>
                <button
                    onClick={handleWhatsAppShare}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                >
                    Share on WhatsApp
                </button>
                <button
                    onClick={handleSmsShare}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-md text-sm"
                >
                    Share via SMS
                </button>
            </div>

            {/* Invoice Preview */}
            <div ref={previewRef} className="bg-white p-4 border rounded-md text-xs print:text-xs max-w-[420px] mx-auto">
                <div className="text-center mb-4">
                    <h2 className="font-bold text-base">PURCHASE INVOICE</h2>
                    <p>Invoice #: {purchase.id}</p>
                    <p>Date: {format(new Date(purchase.date), 'dd MMM yyyy')}</p>
                </div>

                <div className="mb-4">
                    <h4 className="font-semibold border-b mb-1">Supplier Info</h4>
                    <p>{purchase.supplier?.name}</p>
                    <p>{purchase.supplier?.phone}</p>
                    <p>{purchase.supplier?.address}</p>
                </div>

                <table className="w-full border text-xs mb-4">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-1">#</th>
                            <th className="border p-1">Item</th>
                            <th className="border p-1">Unit</th>
                            <th className="border p-1 text-right">Qty</th>
                            <th className="border p-1 text-right">Rate</th>
                            <th className="border p-1 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchase.items.map((item, index) => (
                            <tr key={item.id}>
                                <td className="border p-1">{index + 1}</td>
                                <td className="border p-1">{item.item.name.split('-')[0].trim()}</td>
                                <td className="border p-1">{item.item.unit}</td>
                                <td className="border p-1 text-right">{item.quantity}</td>
                                <td className="border p-1 text-right">{item.unitPrice.toFixed(2)}</td>
                                <td className="border p-1 text-right">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="text-right space-y-1">
                    <p><strong>Subtotal:</strong> ₹{purchase.totalAmount.toFixed(2)}</p>
                    <p><strong>Paid:</strong> ₹{purchase.paidAmount.toFixed(2)}</p>
                    <p><strong>Due:</strong> ₹{(purchase.totalAmount - purchase.paidAmount).toFixed(2)}</p>
                </div>

                <p className="text-center mt-4 text-gray-500 text-xs">This is a computer generated invoice.</p>
            </div>
        </div>
    );
};

export default PurchaseDetail;
