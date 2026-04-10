import Link from 'next/link';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/items', label: 'Items' },
  { href: '/customers', label: 'Customers' },
  { href: '/suppliers', label: 'Suppliers' },
  { href: '/purchases', label: 'Purchases' },
  { href: '/sales', label: 'Sales' },
  { href: '/payments', label: 'Payments' },
  { href: '/receipts', label: 'Receipts' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/reports', label: 'Reports' },
  { href: '/database', label: 'Database' },
];

export function DashboardShell({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>PB System</h1>
        <nav>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
