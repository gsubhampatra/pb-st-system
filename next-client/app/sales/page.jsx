import { ModulePlaceholder } from '@/components/ModulePlaceholder';

export default function SalesPage() {
  return (
    <ModulePlaceholder
      title="Sales"
      note="Sales list route is ready."
      links={[{ href: '/sales/new', label: 'Create Sale' }]}
    />
  );
}
