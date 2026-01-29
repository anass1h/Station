import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';

export function PompisteLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-secondary-100 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-secondary-900 text-lg">Station Service</span>
            <p className="text-xs text-secondary-500">Interface Pompiste</p>
          </div>
        </div>

        {/* User info & logout */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium text-secondary-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-secondary-500">Pompiste</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-secondary-100 hover:bg-secondary-200 rounded-xl transition-colors"
            title="Deconnexion"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6 text-secondary-600" />
          </button>
        </div>
      </header>

      {/* Main content - optimized for touch */}
      <main className="flex-1 p-4 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
