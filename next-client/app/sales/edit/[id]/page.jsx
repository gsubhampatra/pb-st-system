import { ModulePlaceholder } from '@/components/ModulePlaceholder';

export default function EditSalePage({ params }) {
  return (
    <ModulePlaceholder
      title={`Edit Sale ${params.id}`}
      note="Edit sale dynamic route is ready."
    />
  );
}
