import { ButtonHTMLAttributes, forwardRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-400',
  secondary: 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 disabled:bg-secondary-100',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 disabled:bg-danger-400',
  success: 'bg-success-600 text-white hover:bg-success-700 disabled:bg-success-400',
  outline: 'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 disabled:bg-secondary-50',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading = false, variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" />}
        {children}
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
