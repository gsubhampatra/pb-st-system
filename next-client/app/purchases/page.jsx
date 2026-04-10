import { ModulePlaceholder } from '@/components/ModulePlaceholder';

export default function PurchasesPage() {
  return (
    <ModulePlaceholder
      title="Purchases"
      note="Purchases list route is ready."
      links={[{ href: '/purchases/new', label: 'Create Purchase' }]}
    />
  );
}
