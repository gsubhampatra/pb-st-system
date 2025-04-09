// src/components/purchase/ui/SearchableSelect.jsx
import { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { HiChevronUpDown, HiCheck } from 'react-icons/hi2'; // Example icons

function SearchableSelect({
  label,
  items, // Array of objects with 'id' and 'name'
  selected, // Currently selected item object { id, name }
  onSelect, // Function called with the selected item object
  onQueryChange, // Function called when input text changes
  placeholder = 'Search...',
  loading = false,
  disabled = false,
  displayValue = (item) => item?.name || '', // Function to get display text
  getKey = (item) => item?.id, // Function to get unique key
}) {
  const [query, setQuery] = useState('');

  const handleQueryChange = (event) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    if (onQueryChange) {
      onQueryChange(newQuery);
    }
  };

  const filteredItems = items || []; // Use provided items directly if search is external

  return (
    <Combobox value={selected} onChange={onSelect} disabled={disabled}>
      <div className="relative mt-1">
        {label && (
          <Combobox.Label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </Combobox.Label>
        )}
        <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
          <Combobox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            displayValue={displayValue}
            onChange={handleQueryChange}
            placeholder={placeholder}
            autoComplete="off"
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <HiChevronUpDown
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')} // Optionally clear query on close
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {loading && (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Loading...
              </div>
            )}
            {!loading && filteredItems.length === 0 && query !== '' && (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Nothing found.
              </div>
            )}
             {!loading && filteredItems.length === 0 && query === '' && (
               <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Type to search...
               </div>
             )}
            {!loading &&
              filteredItems.map((item) => (
                <Combobox.Option
                  key={getKey(item)}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    }`
                  }
                  value={item}
                >
                  {({ selected: isSelected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          isSelected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {displayValue(item)}
                      </span>
                      {isSelected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? 'text-white' : 'text-indigo-600'
                          }`}
                        >
                          <HiCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}

export default SearchableSelect;