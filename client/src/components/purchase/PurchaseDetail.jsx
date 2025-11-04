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
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Purchase Invoice - ${purchase.invoiceNo}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A5;
              margin: 10mm;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              font-size: 10pt;
              line-height: 1.3;
              color: #000;
            }
            
            .invoice-container {
              max-width: 100%;
            }
            
            /* Header */
            .invoice-header {
              text-align: center;
              margin-bottom: 12px;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
            }
            
            .company-name {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 2px;
              text-transform: uppercase;
            }
            
            .invoice-title {
              font-size: 12pt;
              font-weight: 600;
              margin-top: 4px;
            }
            
            /* Invoice Info Section */
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              gap: 15px;
              font-size: 9pt;
            }
            
            .invoice-meta, .supplier-info {
              flex: 1;
            }
            
            .section-title {
              font-weight: bold;
              margin-bottom: 4px;
              border-bottom: 1px solid #000;
              padding-bottom: 2px;
            }
            
            .info-row {
              margin-bottom: 2px;
            }
            
            .info-label {
              font-weight: 600;
              display: inline-block;
              min-width: 70px;
            }
            
            /* Items Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 9pt;
            }
            
            .items-table th,
            .items-table td {
              border: 1px solid #000;
              padding: 4px 6px;
            }
            
            .items-table th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: left;
            }
            
            .items-table th.text-right,
            .items-table td.text-right {
              text-align: right;
            }
            
            .items-table th.text-center,
            .items-table td.text-center {
              text-align: center;
            }
            
            /* Summary Section */
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 12px;
            }
            
            .summary-table {
              width: 250px;
              font-size: 9pt;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 8px;
              border: 1px solid #000;
              margin-bottom: -1px;
            }
            
            .summary-row.total {
              background-color: #e0e0e0;
              font-weight: bold;
              font-size: 10pt;
            }
            
            .summary-label {
              font-weight: 600;
            }
            
            .summary-value {
              font-weight: 700;
            }
            
            /* Footer */
            .invoice-footer {
              margin-top: 15px;
              padding-top: 8px;
              border-top: 1px solid #000;
              text-align: center;
              font-size: 8pt;
            }
            
            .footer-contact {
              margin-bottom: 4px;
            }
            
            .footer-note {
              font-style: italic;
              color: #333;
            }
            
            /* Print Styles */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="invoice-header">
              <div class="company-name">Patra Bhandar</div>
              <div class="invoice-title">Purchase Invoice</div>
            </div>
            
            <!-- Invoice Info -->
            <div class="invoice-info">
              <div class="invoice-meta">
                <div class="section-title">Invoice Details</div>
                <div class="info-row">
                  <span class="info-label">Invoice No:</span>
                  <span>${purchase.invoiceNo}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span>${format(new Date(purchase.date), 'dd/MM/yyyy')}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span style="text-transform: capitalize;">${purchase.status}</span>
                </div>
              </div>
              
              <div class="supplier-info">
                <div class="section-title">Supplier Details</div>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span>${purchase.supplier?.name || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span>${purchase.supplier?.phone || 'N/A'}</span>
                </div>
                ${purchase.supplier?.address ? `
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span>${purchase.supplier.address}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 5%;">#</th>
                  <th style="width: 45%;">Item</th>
                  <th class="text-center" style="width: 10%;">Unit</th>
                  <th class="text-right" style="width: 12%;">Qty</th>
                  <th class="text-right" style="width: 14%;">Rate</th>
                  <th class="text-right" style="width: 14%;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${purchase.items
                  .map(
                    (item, i) => `
                    <tr>
                      <td class="text-center">${i + 1}</td>
                      <td>${item.item.name}</td>
                      <td class="text-center">${item.item.unit}</td>
                      <td class="text-right">${item.quantity}</td>
                      <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                      <td class="text-right">₹${(item.quantity * item.unitPrice).toFixed(2)}</td>
                    </tr>
                  `
                  )
                  .join('')}
              </tbody>
            </table>
            
            <!-- Summary -->
            <div class="summary-section">
              <div class="summary-table">
                <div class="summary-row total">
                  <span class="summary-label">Total:</span>
                  <span class="summary-value">₹${purchase.totalAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Paid:</span>
                  <span class="summary-value">₹${purchase.paidAmount.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Due:</span>
                  <span class="summary-value">₹${(purchase.totalAmount - purchase.paidAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="invoice-footer">
              <div class="footer-contact">
                Contact: 7847916571
              </div>
              <div class="footer-note">
                Thank you for your business!
              </div>
            </div>
          </div>
        </body>
      </html>`;

    const printWindow = window.open('', '', 'width=595,height=842');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
