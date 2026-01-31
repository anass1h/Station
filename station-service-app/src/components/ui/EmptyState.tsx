import { FolderOpenIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title = 'Aucune donnee',
  description = 'Aucun element a afficher pour le moment.',
  icon: Icon = FolderOpenIcon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="h-16 w-16 text-secondary-300 mb-4" />
      <h3 className="text-lg font-medium text-secondary-900 mb-1">{title}</h3>
      <p className="text-sm text-secondary-500 text-center mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
