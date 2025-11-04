import React, { useState, useEffect } from 'react';
import { HiDownload } from 'react-icons/hi';
import { api, API_PATHS } from '../../api';

const ReportsPage = () => {
  const [summary, setSummary] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('today'); // Default filter
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [date, setDate] = useState('');

  const months = [
    { label: 'January', value: '0' },
    { label: 'February', value: '1' },
    { label: 'March', value: '2' },
    { label: 'April', value: '3' },
    { label: 'May', value: '4' },
    { label: 'June', value: '5' },
    { label: 'July', value: '6' },
    { label: 'August', value: '7' },
    { label: 'September', value: '8' },
    { label: 'October', value: '9' },
    { label: 'November', value: '10' },
    { label: 'December', value: '11' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const filterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Specific Month' },
    { value: 'date', label: 'Specific Date' }
  ];

  useEffect(() => {
    fetchSummary();
    fetchHistory();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get(API_PATHS.reports.getSummary);
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get(API_PATHS.reports.getDownloadHistory);
      // Server returns { downloads: [...] }
      setHistory(response.data?.downloads || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const toDayBounds = (d) => {
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const buildDateRange = () => {
    const now = new Date();
    if (filter === 'today') {
      return toDayBounds(now);
    }
    if (filter === 'week') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (filter === 'month' && month !== '' && year) {
      const y = Number(year);
      const m = Number(month); // 0-based
      const start = new Date(y, m, 1, 0, 0, 0, 0);
      const end = new Date(y, m + 1, 0, 23, 59, 59, 999); // last day of month
      return { start, end };
    }
    if (filter === 'date' && date) {
      return toDayBounds(date);
    }
    return {};
  };

  const downloadReport = async (type) => {
    setLoading(true);
    try {
      // Map UI type to server-supported reportType
      const typeMap = { purchase: 'purchase', sale: 'sales', stock: 'stock' };
      const reportType = typeMap[type];
      if (!reportType) {
        alert('This report type is not supported for export.');
        return;
      }

      const { start, end } = buildDateRange();
      const params = new URLSearchParams();
      params.set('reportType', reportType);
      if (start) params.set('startDate', start.toISOString());
      if (end) params.set('endDate', end.toISOString());

      const response = await api.get(`${API_PATHS.reports.download}?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      await fetchHistory();
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="mt-2 text-3xl font-semibold text-gray-900">₹{value || 0}</p>
    </div>
  );

  const columns = [
    { title: 'Report Type', key: 'reportType' },
    { title: 'Download Date', key: 'downloadedAt' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard title="Purchases" value={summary.totalPurchases} />
        <StatCard title="Sales" value={summary.totalSales} />
        <StatCard title="Payments" value={summary.totalPayments} />
        <StatCard title="Receipts" value={summary.totalReceipts} />
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Download Reports</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Reports
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded px-4 py-2 w-full md:w-auto"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {filter === 'month' && (
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2"
              >
                <option value="">Select Month</option>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          {filter === 'date' && (
            <div className="mb-4">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {['purchase', 'sale', 'stock'].map((type) => (
              <button
                key={type}
                onClick={() => downloadReport(type)}
                disabled={loading || (filter === 'month' && (month === '' || !year)) || (filter === 'date' && !date)}
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiDownload className="w-5 h-5 mr-2" />
                {type.charAt(0).toUpperCase() + type.slice(1)} Report
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Download History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.length > 0 ? (
                  history.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(item.reportType || '').charAt(0).toUpperCase() + (item.reportType || '').slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.downloadedAt ? new Date(item.downloadedAt).toLocaleString() : ''}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">
                      No download history available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;