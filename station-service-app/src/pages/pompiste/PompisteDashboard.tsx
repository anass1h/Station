import { useNavigate } from 'react-router-dom';
import {
  PlayIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';

export function PompisteDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // TODO: Get real shift data from API
  const hasActiveShift = false;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Welcome Card */}
      <div className="card text-center">
        <h1 className="text-2xl font-bold text-secondary-900 mb-2">
          Bonjour, {user?.firstName}!
        </h1>
        <p className="text-secondary-500">
          {hasActiveShift
            ? 'Votre shift est en cours'
            : 'Aucun shift actif pour le moment'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {!hasActiveShift ? (
          <Button
            variant="primary"
            size="lg"
            className="col-span-2 h-24 text-lg"
            onClick={() => navigate('/pompiste/shift')}
          >
            <PlayIcon className="h-8 w-8 mr-3" />
            Demarrer un Shift
          </Button>
        ) : (
          <>
            <Button
              variant="success"
              size="lg"
              className="h-24 text-lg flex-col gap-2"
              onClick={() => navigate('/pompiste/vente')}
            >
              <ShoppingCartIcon className="h-8 w-8" />
              Nouvelle Vente
            </Button>
            <Button
              variant="warning"
              size="lg"
              className="h-24 text-lg flex-col gap-2"
              onClick={() => navigate('/pompiste/caisse')}
            >
              <BanknotesIcon className="h-8 w-8" />
              Cloture Caisse
            </Button>
          </>
        )}
      </div>

      {/* Shift Info */}
      {hasActiveShift && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <ClockIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-secondary-900">
              Shift en cours
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-secondary-500">Debut</p>
              <p className="font-medium">--:--</p>
            </div>
            <div>
              <p className="text-secondary-500">Duree</p>
              <p className="font-medium">--:--</p>
            </div>
            <div>
              <p className="text-secondary-500">Index debut</p>
              <p className="font-medium">0</p>
            </div>
            <div>
              <p className="text-secondary-500">Ventes</p>
              <p className="font-medium">0 DH</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
