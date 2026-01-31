import { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export const SelectField = forwardRef<HTMLDivElement, SelectFieldProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      placeholder = 'Selectionner...',
      error,
      required,
      disabled,
      searchable = false,
      className = '',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(search.toLowerCase())
        )
      : options;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearch('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearch('');
    };

    return (
      <div ref={ref} className={`space-y-1 ${className}`}>
        <label className="block text-sm font-medium text-secondary-700">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full flex items-center justify-between px-3 py-2 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-100 disabled:cursor-not-allowed ${
              error ? 'border-danger-500' : 'border-secondary-300'
            } ${selectedOption ? 'text-secondary-900' : 'text-secondary-400'}`}
          >
            <span className="truncate">{selectedOption?.label || placeholder}</span>
            <ChevronDownIcon
              className={`h-5 w-5 text-secondary-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
              {searchable && (
                <div className="p-2 border-b border-secondary-200">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                  </div>
                </div>
              )}
              <div className="overflow-y-auto max-h-48">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-secondary-500 text-center">
                    Aucun resultat
                  </div>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-secondary-50 ${
                        option.value === value ? 'bg-primary-50 text-primary-700' : 'text-secondary-900'
                      }`}
                    >
                      <span>{option.label}</span>
                      {option.value === value && <CheckIcon className="h-4 w-4" />}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
