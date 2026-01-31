import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '??';

  const roleLabels: Record<string, string> = {
    POMPISTE: 'Pompiste',
    GESTIONNAIRE: 'Gestionnaire',
    SUPER_ADMIN: 'Super Admin',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
      >
        <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-sm">
          {initials}
        </div>
        <ChevronDownIcon
          className={`h-4 w-4 text-secondary-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-secondary-100">
            <p className="text-sm font-medium text-secondary-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-secondary-500">
              {user?.role ? roleLabels[user.role] : ''}
            </p>
            {user?.email && (
              <p className="text-xs text-secondary-400 mt-1 truncate">
                {user.email}
              </p>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/profil');
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
            >
              <UserIcon className="h-5 w-5 text-secondary-400" />
              Mon profil
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Deconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
