import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="card max-w-md w-full text-center">
      {/* Logo */}
      <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-secondary-900 mb-2">
        Station Service
      </h1>
      <p className="text-secondary-600 mb-8">
        Choisissez votre mode de connexion
      </p>

      {/* Login Options */}
      <div className="space-y-4">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate('/login/email')}
        >
          <svg
            className="w-5 h-5 mr-3"
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
          Connexion Gestionnaire
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => navigate('/login/badge')}
        >
          <svg
            className="w-5 h-5 mr-3"
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
          Connexion Pompiste
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-secondary-200">
        <p className="text-xs text-secondary-400">
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}
