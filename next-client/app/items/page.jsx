'use client';

import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '@/lib/api';

export default function ItemsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['items-list'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.items.getAll);
      return response.data;
    },
  });

  const items = data?.items || [];

  return (
    <section className="panel">
      <h2>Items</h2>
      <p>Live list from existing Express API.</p>

      {isLoading && <p>Loading items...</p>}
      {isError && <p>Unable to load items. Check backend connection.</p>}

      {!isLoading && !isError && (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid var(--border)' }}>Category</th>
                <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid var(--border)' }}>Stock</th>
                <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid var(--border)' }}>Base Price</th>
                <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid var(--border)' }}>Selling Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>{item.name}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>{item.category || '-'}</td>
                  <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                    {item.stock} {item.unit || ''}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                    {Number(item.basePrice || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid var(--border)' }}>
                    {Number(item.sellingPrice || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
