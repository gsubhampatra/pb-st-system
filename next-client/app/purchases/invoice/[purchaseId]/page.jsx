import { ModulePlaceholder } from '@/components/ModulePlaceholder';

export default function PurchaseInvoicePage({ params }) {
  return (
    <ModulePlaceholder
      title={`Purchase Invoice ${params.purchaseId}`}
      note="Dynamic invoice route is ready for invoice component migration."
    />
  );
}
