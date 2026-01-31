type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'secondary';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
};

const dotStyles: Record<StatusVariant, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  info: 'bg-primary-500',
  secondary: 'bg-secondary-500',
};

export function StatusBadge({ label, variant = 'secondary', dot = false }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {label}
    </span>
  );
}
