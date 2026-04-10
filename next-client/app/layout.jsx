import './globals.css';
import { AppProviders } from '@/providers/AppProviders';
import { DashboardShell } from '@/components/DashboardShell';

export const metadata = {
  title: 'PB Stock & Billing - Next',
  description: 'Next.js migration workspace for PB Stock & Billing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <DashboardShell>{children}</DashboardShell>
        </AppProviders>
      </body>
    </html>
  );
}
