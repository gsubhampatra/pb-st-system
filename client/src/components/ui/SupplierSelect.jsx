import SearchableSelect from '../purchase/ui/SearchableSelect';
import { useSuppliers } from '../../contexts/SupplierContext';

const SupplierSelect = ({
  label = 'Supplier *',
  selected,
  onSelect,
  placeholder = 'Type to search suppliers...',
  showCreateButton = false,
  onCreateClick,
  disabled = false,
}) => {
  const {
    suppliers,
    isLoading,
    searchTerm,
    setSearchTerm,
  } = useSuppliers();

  return (
    <div className="space-y-2">
      <SearchableSelect
        label={label}
        items={suppliers || []}
        selected={selected}
        onSelect={onSelect}
        onQueryChange={setSearchTerm}
        placeholder={placeholder}
        loading={isLoading}
        disabled={disabled}
        displayValue={(supplier) => supplier ? `${supplier.name} (${supplier.phone || 'No phone'})` : ''}
      />
      {showCreateButton && onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Supplier not found. Create new?
        </button>
      )}
      {showCreateButton && !selected && !searchTerm && onCreateClick && (
        <button
          type="button"
          onClick={onCreateClick}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Or Create a New Supplier
        </button>
      )}
    </div>
  );
};

export default SupplierSelect;