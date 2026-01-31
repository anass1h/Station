import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-secondary-700">
          {label}
          {props.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 border rounded-lg text-secondary-900 placeholder-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-secondary-100 disabled:cursor-not-allowed ${
            error ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' : 'border-secondary-300'
          } ${className}`}
          {...props}
        />
        {hint && !error && <p className="text-xs text-secondary-500">{hint}</p>}
        {error && <p className="text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
