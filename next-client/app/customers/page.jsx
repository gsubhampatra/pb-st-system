'use client';

import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '@/lib/api';

export default function CustomersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.customers.getAll);
      return response.data;
    },
  });

  const customers = Array.isArray(data) ? data : [];

  return (
    <section className="panel">
      <h2>Customers</h2>
      <p>Live list from existing Express API.</p>

      {isLoading && <p>Loading customers...</p>}
      {isError && <p>Unable to load customers. Check backend connection.</p>}

      {!isLoading && !isError && (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Phone</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>{customer.name}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>{customer.phone || '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>{customer.address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
