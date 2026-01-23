/**
 * Customer Search Component
 * 
 * Autocomplete search input with dropdown suggestions
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { customersService } from '../slice.js';

/**
 * Customer Search props
 * @typedef {Object} CustomerSearchProps
 * @property {import('../types.js').Customer[]} customers - Array of customers
 * @property {string} value - Selected customer ID
 * @property {function(string): void} onChange - Handler when customer is selected
 * @property {string} [placeholder] - Placeholder text
 * @property {boolean} [required] - Whether field is required
 * @property {function(import('../types.js').Customer): string} [getDisplayText] - Custom display text function
 * @property {function(import('../types.js').Customer): boolean} [filter] - Additional filter function
 */

/**
 * Customer Search component
 * @param {CustomerSearchProps} props
 */
export function CustomerSearch({
  customers,
  value,
  onChange,
  placeholder,
  required = false,
  getDisplayText,
  filter,
}) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Get selected customer
  const selectedCustomer = customers.find((c) => c.id === value);

  // Update search query when value changes externally
  useEffect(() => {
    if (selectedCustomer) {
      setSearchQuery(getDisplayText ? getDisplayText(selectedCustomer) : `${selectedCustomer.name} - ${selectedCustomer.phone}`);
    } else if (!value) {
      setSearchQuery('');
    }
  }, [value, selectedCustomer, getDisplayText]);

  // Filter customers based on search query
  const filteredCustomers = customersService.searchCustomers(searchQuery, customers).filter((customer) => {
    if (!customer) return false;
    if (filter) return filter(customer);
    return true;
  });

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    
    // Clear selection if user is typing
    if (value && query !== (getDisplayText ? getDisplayText(selectedCustomer) : `${selectedCustomer?.name} - ${selectedCustomer?.phone}`)) {
      onChange('');
    }
  };

  const handleSelectCustomer = (customerId) => {
    onChange(customerId);
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSearchQuery(getDisplayText ? getDisplayText(customer) : `${customer.name} - ${customer.phone}`);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredCustomers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCustomers.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredCustomers.length) {
          handleSelectCustomer(filteredCustomers[selectedIndex].id);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleFocus = () => {
    if (searchQuery.trim() || filteredCustomers.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e) => {
    // Delay to allow click events on suggestions
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 200);
  };

  const handleClear = () => {
    setSearchQuery('');
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700 mb-2">
        {t('customer')} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id="customer-search"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || t('search') + ' ' + t('customer').toLowerCase() + '...'}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          autoComplete="off"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredCustomers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
        >
          {filteredCustomers.map((customer, index) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSelectCustomer(customer.id)}
              className={`w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${customer.id === value ? 'bg-blue-100' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.phone}</p>
                </div>
                {customer.id === value && (
                  <span className="text-xs text-blue-600 font-medium">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && searchQuery.trim() && filteredCustomers.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-sm text-gray-500">
          {t('noResults') || 'No customers found'}
        </div>
      )}
    </div>
  );
}
