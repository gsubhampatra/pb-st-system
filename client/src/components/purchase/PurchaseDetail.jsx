import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { FiPrinter } from 'react-icons/fi';
import { useRef } from 'react';
import { format } from 'date-fns';
import PrintButton from '../PrintButton';

const PurchaseDetail = ({ purchaseId }) => {
  const previewRef = useRef();

  const { data: purchase, isLoading, isError } = useQuery({
    queryKey: ['purchase', purchaseId],
    queryFn: async () => {
      const response = await api.get(API_PATHS.purchases.getById(purchaseId));
      return response.data;
    }
  });

  // Utility: Convert string to Uint8Array
  function textToBytes(text) {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  async function handleWebBluetoothPrint() {
    const escposText = `
    Patra Bhandar
    PURCHASE INVOICE
    Invoice No: ${purchase.invoiceNo}
    Date: ${new Date(purchase.date).toLocaleDateString('en-IN')}
    Supplier: ${purchase.supplier?.name || ''}

    ------------------------------
    ${purchase.items
        .map(
          (item, i) =>
            `${i + 1}. ${item.item.name.split('-')[0].trim()} ${item.quantity} x ${item.unitPrice.toFixed(2)} = ${(item.quantity * item.unitPrice).toFixed(2)}`
        )
        .join('\n')}
    ------------------------------
    Total: ₹${purchase.totalAmount.toFixed(2)}
    Paid: ₹${purchase.paidAmount.toFixed(2)}
    Due: ₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}
    ------------------------------
    Contact: 7847916571
    Thank you!
    \n\n\n
  `;

    const data = textToBytes(escposText);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "Printer" }],
        optionalServices: [0x1101], // Serial Port
      });

      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService(0x1101);
      const characteristic = await service?.getCharacteristic(0x2A6E); // TX characteristic, may vary

      if (characteristic) {
        await characteristic.writeValue(data);
        alert("Printed successfully!");
      }
    } catch (err) {
      console.error("Bluetooth printing error:", err);
      alert("Failed to print: " + err);
    }
  }



  const handleThermalPrint = () => {
    const content = `
      <html>
        <head>
          <title>Patra Bhandar</title>
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
          <h2>PURCHASE INVOICE</h2>
          <p>Invoice No: ${purchase.invoiceNo}</p>
          <p>Date: ${format(new Date(purchase.date), 'dd/MM/yyyy')}</p>
          <p>Supplier: ${purchase.supplier?.name || ''}</p>
          <div class="line"></div>
  
          <table>
            ${purchase.items
        .map(
          (item, i) => `
              <tr>
                <td>${i + 1}. ${item.item.name.split('-')[0].trim()}</td>
                <td class="right">${item.quantity} x ${item.unitPrice.toFixed(2)}</td>
                <td class="right">${(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>`
        )
        .join('')}
          </table>
  
          <div class="line"></div>
          <table>
            <tr><td>Total</td><td class="right">₹${purchase.totalAmount.toFixed(2)}</td></tr>
            <tr><td>Paid</td><td class="right">₹${purchase.paidAmount.toFixed(2)}</td></tr>
            <tr><td>Due</td><td class="right">₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}</td></tr>
          </table>
  
          <div class="line"></div>
          <p>Contact: 7847916571</p>
          <p>Thank you!</p>
        </body>
      </html>`;

    const printWindow = window.open('', '', 'width=1056,height=1480');
    printWindow.document.write(`
      <style>
        @media print {
          @page {
            size: A6;
            margin: 0;
          }
        }
      </style>
    ` + content);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateShareMessage = () => {
    const items = purchase.items
      .map(
        (item, i) =>
          `${i + 1}. ${item.item.name.split('-')[0].trim()} - ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${(item.quantity * item.unitPrice).toFixed(2)}`
      )
      .join('\n');

    return encodeURIComponent(
      `🧾 Patra Bhandar\nInvoice No: ${purchase.invoiceNo}\nDate: ${format(new Date(purchase.date), 'dd/MM/yyyy')}\nSupplier: ${purchase.supplier?.name}\n\n${items}\n\nTotal: ₹${purchase.totalAmount.toFixed(2)}\nPaid: ₹${purchase.paidAmount.toFixed(2)}\nDue: ₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}\n\nContact: 7847916571`
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
    const message = decodeURIComponent(generateShareMessage());
    const phone = purchase.supplier?.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`sms:${phone}?&body=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert('Supplier phone number not available');
    }
  };
  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (isError) return <div className="text-center py-8 text-red-500">Error loading invoice</div>;

  return (
    <div className="space-y-4 bg-white">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end no-print">

        <button
          onClick={handleThermalPrint}
          className="bg-black text-white px-3 py-1 rounded-md text-sm"
        >
          <FiPrinter className="mr-1" /> Print Invoice
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
       <PrintButton data={purchase} />
      </div>

      {/* Invoice Preview */}
      <div ref={previewRef} className="bg-white p-4 border rounded-md text-xs print:text-xs max-w-[420px] mx-auto">
        <div className="text-center mb-4">
          <h2 className="font-bold text-base">PURCHASE INVOICE</h2>
          <p>Invoice #: {purchase.invoiceNo}</p>
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
