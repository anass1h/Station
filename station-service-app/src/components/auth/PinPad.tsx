interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function PinPad({ value, onChange, maxLength = 6, disabled = false }: PinPadProps) {
  const handleNumber = (num: string) => {
    if (disabled) return;
    if (value.length < maxLength) {
      onChange(value + num);
    }
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
    w-16 h-16 text-2xl font-semibold rounded-xl
    transition-all duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const numberButtonClass = `
    ${buttonClass}
    bg-white text-secondary-800 border-2 border-secondary-200
    hover:bg-secondary-50 hover:border-secondary-300
    active:bg-secondary-100 active:scale-95
  `;

  const actionButtonClass = `
    ${buttonClass}
    bg-secondary-100 text-secondary-600 border-2 border-secondary-200
    hover:bg-secondary-200 hover:border-secondary-300
    active:bg-secondary-300 active:scale-95
  `;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* PIN Display */}
      <div className="flex gap-2 mb-2">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`
              w-10 h-12 rounded-lg border-2 flex items-center justify-center text-2xl
              transition-all duration-200
              ${i < value.length
                ? 'bg-primary-100 border-primary-500 text-primary-700'
                : 'bg-secondary-50 border-secondary-300'
              }
            `}
          >
            {i < value.length ? (
              <span className="w-3 h-3 rounded-full bg-primary-600" />
            ) : null}
          </div>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
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

        {/* Row 4: Clear-0-Backspace */}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className={actionButtonClass}
          title="Effacer tout"
        >
          <svg
            className="w-6 h-6 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => handleNumber('0')}
          disabled={disabled}
          className={numberButtonClass}
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          disabled={disabled}
          className={actionButtonClass}
          title="Effacer"
        >
          <svg
            className="w-6 h-6 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
