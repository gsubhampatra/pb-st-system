import { useQuery } from '@tanstack/react-query';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCheckCircle } from 'react-icons/fi';
import { api, API_PATHS } from '../../api';

const CustomerCreditReport = ({ customerId }) => {
  const { data: creditReport, isLoading, isError } = useQuery({
    queryKey: ['customerCredit', customerId],
    queryFn: async () => {
      const response = await api.get(API_PATHS.customers.getCustomerCredit(customerId));
      return response.data;
    }
  });

  if (isLoading) return <div className="text-center py-8">Loading credit report...</div>;
  if (isError) return <div className="text-center py-8 text-red-500">Error loading credit report</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Credit Summary</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiDollarSign className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                <p className="text-xl font-semibold text-gray-900">
                  ${creditReport.totalSales.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <FiTrendingUp className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Receipts</p>
                <p className="text-xl font-semibold text-gray-900">
                  ${creditReport.totalReceipts.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            creditReport.outstandingBalance > 0 
              ? 'bg-red-50' 
              : creditReport.outstandingBalance < 0 
                ? 'bg-purple-50' 
                : 'bg-gray-50'
          }`}>
            <div className="flex items-center">
              {creditReport.outstandingBalance > 0 ? (
                <FiTrendingDown className="text-red-500 text-2xl mr-3" />
              ) : creditReport.outstandingBalance < 0 ? (
                <FiTrendingUp className="text-purple-500 text-2xl mr-3" />
              ) : (
                <FiCheckCircle className="text-gray-500 text-2xl mr-3" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
                <p className="text-xl font-semibold text-gray-900">
                  ${Math.abs(creditReport.outstandingBalance).toFixed(2)}
                  {creditReport.outstandingBalance > 0 ? ' (Owes)' : 
                   creditReport.outstandingBalance < 0 ? ' (Credit)' : ' (Settled)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
          creditReport.outstandingBalance > 0 
            ? 'bg-red-100 text-red-800' 
            : creditReport.outstandingBalance < 0 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-green-100 text-green-800'
        }`}>
          {creditReport.status}
        </div>
      </div>
    </div>
  );
};

export default CustomerCreditReport;