import { AlertPriority, AlertStatus, AlertType } from '@/services/alertService';
import { SelectField } from '@/components/ui/SelectField';

interface AlertFiltersProps {
  filters: {
    priority: AlertPriority | '';
    type: AlertType | '';
    status: AlertStatus | '';
  };
  onChange: (filters: {
    priority: AlertPriority | '';
    type: AlertType | '';
    status: AlertStatus | '';
  }) => void;
}

export function AlertFilters({ filters, onChange }: AlertFiltersProps) {
  const priorityOptions = [
    { value: 'CRITICAL', label: 'Critique' },
    { value: 'HIGH', label: 'Haute' },
    { value: 'MEDIUM', label: 'Moyenne' },
    { value: 'LOW', label: 'Basse' },
  ];

  const typeOptions = [
    { value: 'LOW_STOCK', label: 'Stock bas' },
    { value: 'SHIFT_OPEN_TOO_LONG', label: 'Shift trop long' },
    { value: 'CASH_VARIANCE', label: 'Écart caisse' },
    { value: 'INDEX_VARIANCE', label: 'Écart index' },
    { value: 'MAINTENANCE_DUE', label: 'Maintenance due' },
    { value: 'CREDIT_LIMIT', label: 'Plafond crédit' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ACKNOWLEDGED', label: 'Prise en charge' },
    { value: 'RESOLVED', label: 'Résolue' },
    { value: 'IGNORED', label: 'Ignorée' },
  ];

  const handleReset = () => {
    onChange({ priority: '', type: '', status: '' });
  };

  return (
    <div className="bg-white rounded-xl border border-secondary-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField
          label="Priorite"
          options={[{ value: '', label: 'Toutes' }, ...priorityOptions]}
          value={filters.priority}
          onChange={(v) => onChange({ ...filters, priority: v as AlertPriority | '' })}
        />
        <SelectField
          label="Type"
          options={[{ value: '', label: 'Tous' }, ...typeOptions]}
          value={filters.type}
          onChange={(v) => onChange({ ...filters, type: v as AlertType | '' })}
        />
        <SelectField
          label="Statut"
          options={[{ value: '', label: 'Tous' }, ...statusOptions]}
          value={filters.status}
          onChange={(v) => onChange({ ...filters, status: v as AlertStatus | '' })}
        />
      </div>
      <button
        onClick={handleReset}
        className="mt-4 text-sm text-primary-600 hover:text-primary-700"
      >
        Reinitialiser les filtres
      </button>
    </div>
  );
}
