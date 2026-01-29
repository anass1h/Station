import { BackspaceIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  decimal?: boolean;
  maxLength?: number;
  disabled?: boolean;
  showDisplay?: boolean;
  displayLabel?: string;
  displayUnit?: string;
}

export function NumericKeypad({
  value,
  onChange,
  decimal = true,
  maxLength = 10,
  disabled = false,
  showDisplay = true,
  displayLabel,
  displayUnit = 'MAD',
}: NumericKeypadProps) {
  const handleNumber = (num: string) => {
    if (disabled) return;
    if (value.length >= maxLength) return;

    // Handle decimal point
    if (num === '.') {
      if (!decimal || value.includes('.')) return;
      if (value === '') {
        onChange('0.');
        return;
      }
    }

    // Prevent leading zeros (except for decimal)
    if (value === '0' && num !== '.') {
      onChange(num);
      return;
    }

    onChange(value + num);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const handleBackspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const buttonClass = `
    w-full h-16 text-2xl font-semibold rounded-xl
    transition-all duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-95
  `;

  const numberButtonClass = `
    ${buttonClass}
    bg-white text-secondary-800 border-2 border-secondary-200
    hover:bg-secondary-50 hover:border-secondary-300
    active:bg-secondary-100
  `;

  const actionButtonClass = `
    ${buttonClass}
    bg-secondary-100 text-secondary-600 border-2 border-secondary-200
    hover:bg-secondary-200 hover:border-secondary-300
    active:bg-secondary-300
  `;

  const decimalButtonClass = `
    ${buttonClass}
    bg-primary-50 text-primary-700 border-2 border-primary-200
    hover:bg-primary-100 hover:border-primary-300
    active:bg-primary-200
  `;

  const formatDisplayValue = () => {
    if (!value) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto">
      {/* Display */}
      {showDisplay && (
        <div className="w-full bg-secondary-900 rounded-xl p-4 text-right">
          {displayLabel && (
            <p className="text-secondary-400 text-sm mb-1">{displayLabel}</p>
          )}
          <div className="flex items-baseline justify-end gap-2">
            <span className="text-4xl font-bold text-white font-mono">
              {formatDisplayValue()}
            </span>
            {displayUnit && (
              <span className="text-xl text-secondary-400">{displayUnit}</span>
            )}
          </div>
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {/* Row 1: 1-2-3 */}
        {['1', '2', '3'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleNumber(num)}
            disabled={disabled}
            className={numberButtonClass}
          >
            {num}
          </button>
        ))}

        {/* Row 2: 4-5-6 */}
        {['4', '5', '6'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleNumber(num)}
            disabled={disabled}
            className={numberButtonClass}
          >
            {num}
          </button>
        ))}

        {/* Row 3: 7-8-9 */}
        {['7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleNumber(num)}
            disabled={disabled}
            className={numberButtonClass}
          >
            {num}
          </button>
        ))}

        {/* Row 4: Clear-0-Decimal/Backspace */}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className={actionButtonClass}
          title="Effacer tout"
        >
          <XMarkIcon className="w-7 h-7 mx-auto" />
        </button>

        <button
          type="button"
          onClick={() => handleNumber('0')}
          disabled={disabled}
          className={numberButtonClass}
        >
          0
        </button>

        {decimal ? (
          <button
            type="button"
            onClick={() => handleNumber('.')}
            disabled={disabled || value.includes('.')}
            className={decimalButtonClass}
          >
            ,
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBackspace}
            disabled={disabled}
            className={actionButtonClass}
            title="Effacer"
          >
            <BackspaceIcon className="w-7 h-7 mx-auto" />
          </button>
        )}
      </div>

      {/* Backspace button when decimal is enabled */}
      {decimal && (
        <button
          type="button"
          onClick={handleBackspace}
          disabled={disabled}
          className={`${actionButtonClass} w-full`}
          title="Effacer dernier caractere"
        >
          <BackspaceIcon className="w-7 h-7 mx-auto" />
        </button>
      )}
    </div>
  );
}
