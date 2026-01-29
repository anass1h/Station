import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { PinPad } from '@/components/auth';
import { useAuthStore } from '@/stores/authStore';

export function LoginBadgeForm() {
  const navigate = useNavigate();
  const { loginByBadge, isLoading, error, clearError } = useAuthStore();

  const [badgeCode, setBadgeCode] = useState('');
  const [pinCode, setPinCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await loginByBadge(badgeCode, pinCode);
    } catch {
      // Error is handled by the store
      setPinCode(''); // Clear PIN on error
    }
  };

  const isValid = badgeCode.length >= 3 && pinCode.length === 6;

  return (
    <div className="card max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-1">
          Connexion Pompiste
        </h1>
        <p className="text-secondary-600 text-sm">
          Scannez votre badge ou entrez votre code
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
          <p className="text-danger-800 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Badge Code Input */}
        <Input
          label="Code Badge"
          type="text"
          value={badgeCode}
          onChange={(e) => setBadgeCode(e.target.value.toUpperCase())}
          placeholder="Ex: P001"
          required
          autoComplete="off"
          autoFocus
          className="text-center text-lg font-mono tracking-wider"
        />

        {/* PIN Pad */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-secondary-700 mb-3 text-center">
            Code PIN (6 chiffres)
          </label>
          <PinPad
            value={pinCode}
            onChange={setPinCode}
            maxLength={6}
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
          disabled={!isValid}
        >
          Se connecter
        </Button>
      </form>

      {/* Back Link */}
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          <svg
            className="w-4 h-4 inline mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Retour
        </button>
      </div>
    </div>
  );
}
