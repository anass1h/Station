import { NumericKeypad } from './NumericKeypad';

interface IndexInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function IndexInput({
  value,
  onChange,
  min,
  max,
  label = 'Index compteur (litres)',
  error,
  disabled = false,
}: IndexInputProps) {
  const numericValue = parseFloat(value) || 0;

  // Validate against min/max
  const isValid = () => {
    if (min !== undefined && numericValue < min) return false;
    if (max !== undefined && numericValue > max) return false;
    return true;
  };

  const getValidationMessage = () => {
    if (min !== undefined && numericValue < min) {
      return `L'index doit etre superieur ou egal a ${min.toLocaleString('fr-FR')} L`;
    }
    if (max !== undefined && numericValue > max) {
      return `L'index doit etre inferieur ou egal a ${max.toLocaleString('fr-FR')} L`;
    }
    return null;
  };

  const validationMessage = error || getValidationMessage();

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="text-center">
        <p className="text-lg font-medium text-secondary-700">{label}</p>
        {min !== undefined && (
          <p className="text-sm text-secondary-500 mt-1">
            Index minimum : {min.toLocaleString('fr-FR')} L
          </p>
        )}
      </div>

      {/* Keypad */}
      <NumericKeypad
        value={value}
        onChange={onChange}
        decimal={true}
        maxLength={12}
        disabled={disabled}
        showDisplay={true}
        displayLabel={label}
        displayUnit="L"
      />

      {/* Validation message */}
      {validationMessage && (
        <div className={`
          text-center p-3 rounded-lg
          ${!isValid() || error ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700'}
        `}>
          {validationMessage}
        </div>
      )}

      {/* Quick actions */}
      {min !== undefined && (
        <button
          type="button"
          onClick={() => onChange(min.toString())}
          disabled={disabled}
          className="w-full py-3 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-xl transition-colors"
        >
          Utiliser l'index actuel ({min.toLocaleString('fr-FR')} L)
        </button>
      )}
    </div>
  );
}
