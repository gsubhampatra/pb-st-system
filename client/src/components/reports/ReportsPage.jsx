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
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const downloadReport = async (type) => {
    setLoading(true);
    try {
      // Build query parameters based on filter type
      let queryParams = { type, filter };
      
      if (filter === 'month' && month !== '' && year) {
        queryParams.month = month;
        queryParams.year = year;
      } else if (filter === 'date' && date) {
        queryParams.date = date;
      }
      
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await api.get(`${API_PATHS.reports.download}?${queryString}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    {
      title: 'Report Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => text.charAt(0).toUpperCase() + text.slice(1)
    },
    {
      title: 'Download Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => new Date(text).toLocaleString()
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard title="Today's Purchases" value={summary.purchases} />
        <StatCard title="Today's Sales" value={summary.sales} />
        <StatCard title="Today's Payments" value={summary.payments} />
        <StatCard title="Today's Receipts" value={summary.receipts} />
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
            {['purchase', 'sale', 'payment', 'receipt'].map((type) => (
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
                        {columns[0].render(item.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {columns[1].render(item.date)}
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