import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, Header } from '@/components/layout';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/shifts': 'Gestion des shifts',
  '/ventes': 'Ventes',
  '/stock': 'Stock',
  '/livraisons': 'Livraisons',
  '/clients': 'Clients',
  '/factures': 'Factures',
  '/stations': 'Stations',
  '/cuves': 'Cuves',
  '/distributeurs': 'Distributeurs',
  '/pompistes': 'Pompistes',
  '/prix': 'Prix du carburant',
  '/alertes': 'Alertes',
  '/admin/clients': 'Gestion des Clients',
  '/profil': 'Mon profil',
};

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = pageTitles[location.pathname] || 'Station Service';

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header title={pageTitle} onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
