import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { FiPrinter, FiShare2 } from 'react-icons/fi';
import { useRef } from 'react';
import { format } from 'date-fns';

const SaleDetail = ({ saleId }) => {
  const previewRef = useRef();

  const { data: sale, isLoading, isError } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: async () => {
      const response = await api.get(API_PATHS.sales.getById(saleId));
      return response.data;
    }
  });

  const handleThermalPrint = () => {
    const content = `
      <html>
        <head>
          <title>Sale Receipt</title>
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
              margin-top: 6px;
            }
            td {
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
          <h2>SALE RECEIPT</h2>
          <p>Date: ${format(new Date(sale.date), 'dd/MM/yyyy')}</p>
          <p>Customer: ${sale.customer?.name || ''}</p>
          <div class="line"></div>
  
          <table>
            ${sale.items
              .map(
                (item, i) => `
                  <tr>
                    <td>${i + 1}. ${item.item.name.split('-')[0].trim()}</td>
                    <td class="right">${item.quantity} x ${item.unitPrice.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td class="right">Total</td>
                    <td class="right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>`
              )
              .join('')}
          </table>
  
          <div class="line"></div>
          <table>
            <tr><td>Total</td><td class="right">₹${sale.totalAmount.toFixed(2)}</td></tr>
            <tr><td>Received</td><td class="right">₹${sale.receivedAmount.toFixed(2)}</td></tr>
            <tr><td>Due</td><td class="right">₹${(sale.totalAmount - sale.receivedAmount).toFixed(2)}</td></tr>
          </table>
  
          <div class="line"></div>
          <p>Contact: 7847916571</p>
          <p>Thank you!</p>
        </body>
      </html>`;

    const printWindow = window.open('', '', 'width=300,height=600');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateShareMessage = () => {
    const items = sale.items
      .map(
        (item, i) =>
          `${i + 1}. ${item.item.name.split('-')[0].trim()} - ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${(item.quantity * item.unitPrice).toFixed(2)}`
      )
      .join('\n');

    return encodeURIComponent(
      `🧾 Sale Receipt\nDate: ${format(new Date(sale.date), 'dd/MM/yyyy')}\nCustomer: ${sale.customer?.name}\n\n${items}\n\nTotal: ₹${sale.totalAmount.toFixed(2)}\nReceived: ₹${sale.receivedAmount.toFixed(2)}\nDue: ₹${(sale.totalAmount - sale.receivedAmount).toFixed(2)}\n\nContact: 7847916571`
    );
  };

  const handleWhatsAppShare = () => {
    const message = generateShareMessage();
    const phone = sale.customer?.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
    } else {
      alert('Customer phone number not available');
    }
  };

  const handleSmsShare = () => {
    const message = decodeURIComponent(generateShareMessage());
    const phone = sale.customer?.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`sms:${phone}?&body=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert('Customer phone number not available');
    }
  };

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (isError) return <div className="text-center py-8 text-red-500">Error loading sale details</div>;

  return (
    <div className="space-y-4 bg-white">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end no-print">
        <button
          onClick={handleThermalPrint}
          className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
        >
          <FiPrinter className="mr-1" /> Print Receipt
        </button>
        <div className="relative group">
          <button className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
            <FiShare2 className="mr-1" /> Share
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 hidden group-hover:block">
            <div className="py-1">
              <button
                onClick={handleWhatsAppShare}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Share via WhatsApp
              </button>
              <button
                onClick={handleSmsShare}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Share via SMS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sale Details */}
      <div ref={previewRef} className="p-6 border rounded shadow-sm text-sm">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-xl">SALE RECEIPT</h3>
          <p>Date: {format(new Date(sale.date), 'dd MMM yyyy')}</p>
        </div>

        <div className="mb-4">
          <h4 className="font-semibold border-b mb-1">Customer Info</h4>
          <p>{sale.customer?.name}</p>
          <p>{sale.customer?.phone}</p>
          <p>{sale.customer?.address}</p>
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
            {sale.items.map((item, index) => (
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
          <p><strong>Subtotal:</strong> ₹{sale.totalAmount.toFixed(2)}</p>
          <p><strong>Received:</strong> ₹{sale.receivedAmount.toFixed(2)}</p>
          <p><strong>Due:</strong> ₹{(sale.totalAmount - sale.receivedAmount).toFixed(2)}</p>
        </div>

        <div className="mt-4 pt-4 border-t text-center text-xs text-gray-500">
          <p>If you have any questions about this receipt, please contact</p>
          <p>Phone: 7847916571, Email: example@example.com</p>
          <p className="mt-4 text-center text-gray-500 text-xs">This is a computer generated receipt.</p>
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;