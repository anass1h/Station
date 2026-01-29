import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

export function LoginEmailForm() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(email, password);
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="card max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-secondary-900 mb-1">
          Connexion Gestionnaire
        </h1>
        <p className="text-secondary-600 text-sm">
          Entrez vos identifiants pour acceder au tableau de bord
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
          <p className="text-danger-800 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Adresse email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="exemple@station.com"
          required
          autoComplete="email"
          autoFocus
        />

        <div className="relative">
          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-secondary-400 hover:text-secondary-600"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isLoading}
          disabled={!email || !password}
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
