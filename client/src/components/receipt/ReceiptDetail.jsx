import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { FiPrinter } from 'react-icons/fi';
import { useRef } from 'react';
import { format } from 'date-fns';

const ReceiptDetail = ({ receiptId }) => {
  const printRef = useRef();

  const { data: receipt, isLoading, isError } = useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: async () => {
      const response = await api.get(API_PATHS.receipts.getById(receiptId));
      return response.data;
    }
  });

  const handlePrint = () => {
    const content = `
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              line-height: 1.5;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-weight: bold;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            .label {
              font-weight: bold;
              width: 150px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
            @media print {
              body {
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Payment Receipt</div>
            <div>${format(new Date(), 'MMMM dd, yyyy')}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Receipt Information</div>
            <div class="row">
              <div class="label">Receipt Date:</div>
              <div>${format(new Date(receipt.date), 'MMMM dd, yyyy')}</div>
            </div>
            <div class="row">
              <div class="label">Amount:</div>
              <div>$${receipt.amount.toFixed(2)}</div>
            </div>
            <div class="row">
              <div class="label">Method:</div>
              <div>${receipt.method.toUpperCase()}</div>
            </div>
            ${receipt.method === 'account' ? `
            <div class="row">
              <div class="label">Account:</div>
              <div>${receipt.account.bankName} - ${receipt.account.accountNumber}</div>
            </div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="row">
              <div class="label">Name:</div>
              <div>${receipt.customer.name}</div>
            </div>
            ${receipt.customer.phone ? `
            <div class="row">
              <div class="label">Phone:</div>
              <div>${receipt.customer.phone}</div>
            </div>` : ''}
            ${receipt.customer.address ? `
            <div class="row">
              <div class="label">Address:</div>
              <div>${receipt.customer.address}</div>
            </div>` : ''}
          </div>
          
          ${receipt.note ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <p>${receipt.note}</p>
          </div>` : ''}
          
          <div class="footer">
            <p>This is an electronically generated receipt and does not require signature.</p>
            <p>Receipt ID: ${receipt.id}</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      // printWindow.close();
    }, 500);
  };

  if (isLoading) return <div className="text-center py-8">Loading receipt details...</div>;
  if (isError) return <div className="text-center py-8 text-red-500">Error loading receipt details</div>;
  if (!receipt) return <div className="text-center py-8 text-yellow-500">Receipt not found</div>;

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Print Button */}
      <div className="flex justify-end">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <FiPrinter className="mr-2 -ml-1 h-4 w-4" />
          Print Receipt
        </button>
      </div>

      {/* Receipt Details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Receipt Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the payment received from customer.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Receipt Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {format(new Date(receipt.date), 'MMMM dd, yyyy')}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {receipt.customer.name}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-sm font-bold text-green-600 sm:mt-0 sm:col-span-2">
                ${receipt.amount.toFixed(2)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                {receipt.method}
              </dd>
            </div>
            {receipt.method === 'account' && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Account</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {receipt.account?.bankName} - {receipt.account?.accountNumber}
                </dd>
              </div>
            )}
            {receipt.note && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Note</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {receipt.note}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{receipt.customer.name}</dd>
            </div>
            {receipt.customer.phone && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{receipt.customer.phone}</dd>
              </div>
            )}
            {receipt.customer.address && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{receipt.customer.address}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Receipt ID Reference */}
      <div className="text-right text-xs text-gray-500 pt-2">
        <p>Receipt ID: {receipt.id}</p>
        <p>Generated on: {format(new Date(), 'MMMM dd, yyyy h:mm a')}</p>
      </div>
    </div>
  );
};

export default ReceiptDetail;