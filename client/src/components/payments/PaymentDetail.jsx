import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '../../api';
import { FiPrinter } from 'react-icons/fi';
import { useRef } from 'react';
import { format } from 'date-fns';

const PaymentDetail = ({ paymentId }) => {
  const printRef = useRef();

  const { data: payment, isLoading, isError } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      const response = await api.get(API_PATHS.payments.getById(paymentId));
      return response.data;
    }
  });

  const handlePrint = () => {
    const content = `
      <html>
        <head>
          <title>Payment Receipt</title>
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
            <div class="section-title">Payment Information</div>
            <div class="row">
              <div class="label">Payment Date:</div>
              <div>${format(new Date(payment.date), 'MMMM dd, yyyy')}</div>
            </div>
            <div class="row">
              <div class="label">Amount:</div>
              <div>$${payment.amount.toFixed(2)}</div>
            </div>
            <div class="row">
              <div class="label">Method:</div>
              <div>${payment.method.toUpperCase()}</div>
            </div>
            ${payment.method === 'account' ? `
            <div class="row">
              <div class="label">Account:</div>
              <div>${payment.account.bankName} - ${payment.account.accountNumber}</div>
            </div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Supplier Information</div>
            <div class="row">
              <div class="label">Name:</div>
              <div>${payment.supplier.name}</div>
            </div>
            ${payment.supplier.phone ? `
            <div class="row">
              <div class="label">Phone:</div>
              <div>${payment.supplier.phone}</div>
            </div>` : ''}
            ${payment.supplier.address ? `
            <div class="row">
              <div class="label">Address:</div>
              <div>${payment.supplier.address}</div>
            </div>` : ''}
          </div>
          
          ${payment.note ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <p>${payment.note}</p>
          </div>` : ''}
          
          <div class="footer">
            <p>This is an electronically generated receipt and does not require signature.</p>
            <p>Receipt ID: ${payment.id}</p>
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

  if (isLoading) return <div className="text-center py-8">Loading payment details...</div>;
  if (isError) return <div className="text-center py-8 text-red-500">Error loading payment details</div>;
  if (!payment) return <div className="text-center py-8 text-yellow-500">Payment not found</div>;

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

      {/* Payment Details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about the payment made to supplier.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Payment Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {format(new Date(payment.date), 'MMMM dd, yyyy')}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Supplier</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {payment.supplier.name}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Amount</dt>
              <dd className="mt-1 text-sm font-bold text-red-600 sm:mt-0 sm:col-span-2">
                ${payment.amount.toFixed(2)}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
                {payment.method}
              </dd>
            </div>
            {payment.method === 'account' && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Account</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment.account?.bankName} - {payment.account?.accountNumber}
                </dd>
              </div>
            )}
            {payment.note && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Note</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment.note}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Supplier Details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Supplier Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{payment.supplier.name}</dd>
            </div>
            {payment.supplier.phone && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{payment.supplier.phone}</dd>
              </div>
            )}
            {payment.supplier.address && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{payment.supplier.address}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Receipt ID Reference */}
      <div className="text-right text-xs text-gray-500 pt-2">
        <p>Receipt ID: {payment.id}</p>
        <p>Generated on: {format(new Date(), 'MMMM dd, yyyy h:mm a')}</p>
      </div>
    </div>
  );
};

export default PaymentDetail;