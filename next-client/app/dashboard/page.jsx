'use client';

import { useQuery } from '@tanstack/react-query';
import { api, API_PATHS } from '@/lib/api';
import { ModulePlaceholder } from '@/components/ModulePlaceholder';

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{Number(value || 0).toLocaleString('en-IN')}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await api.get(API_PATHS.reports.getSummary);
      return response.data;
    },
  });

  return (
    <>
      <ModulePlaceholder
        title="Migration Dashboard"
        note="This Next.js shell is live and pulling data from your existing Express backend."
      />

      {isLoading && <section className="panel">Loading summary...</section>}
      {isError && (
        <section className="panel">Unable to load summary. Confirm server is running on port 3000.</section>
      )}

      {!isLoading && !isError && (
        <section className="panel">
          <h2>Live Summary</h2>
          <div className="stats-grid">
            <StatCard label="Sales" value={data?.totalSales} />
            <StatCard label="Purchases" value={data?.totalPurchases} />
            <StatCard label="Receipts" value={data?.totalReceipts} />
            <StatCard label="Payments" value={data?.totalPayments} />
            <StatCard label="Customers" value={data?.totalCustomers} />
            <StatCard label="Suppliers" value={data?.totalSuppliers} />
            <StatCard label="Items" value={data?.totalItems} />
          </div>
        </section>
      )}
    </>
  );
}
