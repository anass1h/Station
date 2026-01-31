import { useState, useMemo } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { EmptyState } from './EmptyState';

type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableAction<T> {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: (item: T) => void;
  variant?: 'primary' | 'danger';
  hidden?: (item: T) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  actions?: TableAction<T>[];
  keyExtractor: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  onRowClick,
  actions,
  keyExtractor,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50 border-b border-secondary-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                  >
                    <div className="h-4 bg-secondary-200 rounded w-20 animate-pulse" />
                  </th>
                ))}
                {actions && <th className="px-4 py-3 w-24" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-4">
                      <div className="h-4 bg-secondary-100 rounded w-full animate-pulse" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-4">
                      <div className="h-8 bg-secondary-100 rounded w-16 animate-pulse" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-secondary-200">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-50 border-b border-secondary-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer select-none hover:bg-secondary-100' : ''
                  } ${col.className || ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="flex flex-col">
                        <ChevronUpIcon
                          className={`h-3 w-3 -mb-1 ${
                            sortKey === col.key && sortDirection === 'asc'
                              ? 'text-primary-600'
                              : 'text-secondary-400'
                          }`}
                        />
                        <ChevronDownIcon
                          className={`h-3 w-3 ${
                            sortKey === col.key && sortDirection === 'desc'
                              ? 'text-primary-600'
                              : 'text-secondary-400'
                          }`}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider w-24">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100">
            {sortedData.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`${onRowClick ? 'cursor-pointer hover:bg-secondary-50' : ''} transition-colors`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-4 text-sm text-secondary-900 ${col.className || ''}`}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {actions.map((action, index) => {
                        if (action.hidden?.(item)) return null;
                        const Icon = action.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => action.onClick(item)}
                            title={action.label}
                            className={`p-2 rounded-lg transition-colors ${
                              action.variant === 'danger'
                                ? 'text-danger-600 hover:bg-danger-50'
                                : 'text-secondary-600 hover:bg-secondary-100'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Re-export icons for convenience
export { PencilIcon, TrashIcon };
