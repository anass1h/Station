import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-100 flex flex-col">
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-secondary-400">
          Station Service v1.0.0
        </p>
      </footer>
    </div>
  );
}
