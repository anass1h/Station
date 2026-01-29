import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

interface Alert {
  id: string;
  type: 'LOW_STOCK' | 'SHIFT_DURATION' | 'MAINTENANCE' | 'PAYMENT_OVERDUE';
  message: string;
  createdAt: string;
  isRead: boolean;
}

// TODO: Replace with real data from API
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'LOW_STOCK',
    message: 'Niveau bas - Cuve Gasoil (15%)',
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    id: '2',
    type: 'SHIFT_DURATION',
    message: 'Shift de Ahmed depasse 10h',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
  },
];

export function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [alerts] = useState<Alert[]>(mockAlerts);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const hasAlerts = unreadCount > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAlertTypeColor = (type: Alert['type']) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'bg-warning-100 text-warning-700';
      case 'SHIFT_DURATION':
        return 'bg-primary-100 text-primary-700';
      case 'MAINTENANCE':
        return 'bg-secondary-100 text-secondary-700';
      case 'PAYMENT_OVERDUE':
        return 'bg-danger-100 text-danger-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  const getAlertTypeLabel = (type: Alert['type']) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'Stock';
      case 'SHIFT_DURATION':
        return 'Shift';
      case 'MAINTENANCE':
        return 'Maintenance';
      case 'PAYMENT_OVERDUE':
        return 'Paiement';
      default:
        return 'Alerte';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "A l'instant";
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-secondary-100 transition-colors"
      >
        {hasAlerts ? (
          <BellAlertIcon className="h-6 w-6 text-warning-500" />
        ) : (
          <BellIcon className="h-6 w-6 text-secondary-500" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-secondary-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-secondary-100 flex items-center justify-between">
            <h3 className="font-semibold text-secondary-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-danger-100 text-danger-700 px-2 py-0.5 rounded-full">
                {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Alerts list */}
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-secondary-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`px-4 py-3 border-b border-secondary-50 hover:bg-secondary-50 cursor-pointer ${
                    !alert.isRead ? 'bg-primary-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${getAlertTypeColor(alert.type)}`}
                    >
                      {getAlertTypeLabel(alert.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-secondary-900 truncate">
                        {alert.message}
                      </p>
                      <p className="text-xs text-secondary-400 mt-0.5">
                        {formatTime(alert.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-secondary-100">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/alertes');
              }}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Voir toutes les alertes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
