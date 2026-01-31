import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout, PompisteLayout, AuthLayout } from '@/layouts';
import {
  LoginPage,
  LoginEmailForm,
  LoginBadgeForm,
  DashboardPage,
  PompisteHomePage,
  StartShiftPage,
  ShiftInProgressPage,
  NewSalePage,
  EndShiftPage,
  CashRegisterPage,
  PlaceholderPage,
} from '@/pages';
import {
  StationsPage,
  StationFormPage,
  TanksPage,
  TankFormPage,
  DispensersPage,
  DispenserFormPage,
  NozzlesPage,
  NozzleFormPage,
  PompistesPage,
  PompisteFormPage,
  PricesPage,
  PriceFormPage,
  SuppliersPage,
  SupplierFormPage,
  PaymentMethodsPage,
} from '@/pages/gestion';
import {
  ShiftsPage,
  ShiftDetailPage,
  SalesPage,
  SaleDetailPage,
  DeliveriesPage,
  DeliveryFormPage,
  StockPage,
  StockAdjustmentPage,
  CashRegistersPage,
  ClientsPage,
  ClientFormPage,
  ClientDetailPage,
  InvoicesPage,
  InvoiceFormPage,
  InvoiceDetailPage,
} from '@/pages/operations';
import { DebtsPage, DebtDetailPage, NewDebtPage } from '@/pages/debts';
import { AlertsPage, AlertDetailPage } from '@/pages/alerts';
import { useAuthStore } from '@/stores/authStore';

// Protected Route wrapper with role check
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('POMPISTE' | 'GESTIONNAIRE' | 'ADMIN' | 'SUPER_ADMIN')[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to default page based on role
    switch (user.role) {
      case 'POMPISTE':
        return <Navigate to="/pompiste" replace />;
      case 'GESTIONNAIRE':
        return <Navigate to="/dashboard" replace />;
      case 'SUPER_ADMIN':
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

// Auth redirect based on role
function AuthRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user && location.pathname.startsWith('/login')) {
      switch (user.role) {
        case 'POMPISTE':
          navigate('/pompiste', { replace: true });
          break;
        case 'GESTIONNAIRE':
        case 'SUPER_ADMIN':
          navigate('/dashboard', { replace: true });
          break;
        default:
          navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname]);

  return null;
}

// Login route wrapper - redirects if already authenticated
function LoginRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    switch (user.role) {
      case 'POMPISTE':
        return <Navigate to="/pompiste" replace />;
      case 'GESTIONNAIRE':
      case 'SUPER_ADMIN':
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

function App() {
  return (
    <>
      <AuthRedirect />
      <Routes>
        {/* Auth routes with AuthLayout */}
        <Route
          element={
            <LoginRoute>
              <AuthLayout />
            </LoginRoute>
          }
        >
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/email" element={<LoginEmailForm />} />
          <Route path="/login/badge" element={<LoginBadgeForm />} />
        </Route>

        {/* Pompiste routes with PompisteLayout */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['POMPISTE']}>
              <PompisteLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/pompiste" element={<PompisteHomePage />} />
          <Route path="/pompiste/demarrer-shift" element={<StartShiftPage />} />
          <Route path="/pompiste/shift-en-cours" element={<ShiftInProgressPage />} />
          <Route path="/pompiste/nouvelle-vente" element={<NewSalePage />} />
          <Route path="/pompiste/cloturer-shift" element={<EndShiftPage />} />
          <Route path="/pompiste/cloture-caisse" element={<CashRegisterPage />} />
        </Route>

        {/* Gestionnaire & Admin routes with MainLayout */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['GESTIONNAIRE', 'SUPER_ADMIN']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Operations - Shifts */}
          <Route path="/operations/shifts" element={<ShiftsPage />} />
          <Route path="/operations/shifts/:id" element={<ShiftDetailPage />} />

          {/* Operations - Ventes */}
          <Route path="/operations/ventes" element={<SalesPage />} />
          <Route path="/operations/ventes/:id" element={<SaleDetailPage />} />

          {/* Operations - Livraisons */}
          <Route path="/operations/livraisons" element={<DeliveriesPage />} />
          <Route path="/operations/livraisons/nouveau" element={<DeliveryFormPage />} />

          {/* Operations - Stock */}
          <Route path="/operations/stock" element={<StockPage />} />
          <Route path="/operations/stock/ajustement" element={<StockAdjustmentPage />} />

          {/* Operations - Caisses */}
          <Route path="/operations/caisses" element={<CashRegistersPage />} />

          {/* Operations - Clients */}
          <Route path="/operations/clients" element={<ClientsPage />} />
          <Route path="/operations/clients/nouveau" element={<ClientFormPage />} />
          <Route path="/operations/clients/:id" element={<ClientDetailPage />} />
          <Route path="/operations/clients/:id/modifier" element={<ClientFormPage />} />

          {/* Operations - Factures */}
          <Route path="/operations/factures" element={<InvoicesPage />} />
          <Route path="/operations/factures/nouveau" element={<InvoiceFormPage />} />
          <Route path="/operations/factures/:id" element={<InvoiceDetailPage />} />
          <Route path="/operations/factures/:id/modifier" element={<InvoiceFormPage />} />

          {/* Gestion - Stations */}
          <Route path="/gestion/stations" element={<StationsPage />} />
          <Route path="/gestion/stations/nouveau" element={<StationFormPage />} />
          <Route path="/gestion/stations/:id" element={<StationFormPage />} />

          {/* Gestion - Cuves */}
          <Route path="/gestion/cuves" element={<TanksPage />} />
          <Route path="/gestion/cuves/nouveau" element={<TankFormPage />} />
          <Route path="/gestion/cuves/:id" element={<TankFormPage />} />

          {/* Gestion - Distributeurs */}
          <Route path="/gestion/distributeurs" element={<DispensersPage />} />
          <Route path="/gestion/distributeurs/nouveau" element={<DispenserFormPage />} />
          <Route path="/gestion/distributeurs/:id" element={<DispenserFormPage />} />

          {/* Gestion - Pistolets */}
          <Route path="/gestion/pistolets" element={<NozzlesPage />} />
          <Route path="/gestion/pistolets/nouveau" element={<NozzleFormPage />} />
          <Route path="/gestion/pistolets/:id" element={<NozzleFormPage />} />

          {/* Gestion - Pompistes */}
          <Route path="/gestion/pompistes" element={<PompistesPage />} />
          <Route path="/gestion/pompistes/nouveau" element={<PompisteFormPage />} />
          <Route path="/gestion/pompistes/:id" element={<PompisteFormPage />} />

          {/* Gestion - Prix */}
          <Route path="/gestion/prix" element={<PricesPage />} />
          <Route path="/gestion/prix/nouveau" element={<PriceFormPage />} />

          {/* Gestion - Fournisseurs */}
          <Route path="/gestion/fournisseurs" element={<SuppliersPage />} />
          <Route path="/gestion/fournisseurs/nouveau" element={<SupplierFormPage />} />
          <Route path="/gestion/fournisseurs/:id" element={<SupplierFormPage />} />

          {/* Gestion - Moyens de paiement */}
          <Route path="/gestion/paiements" element={<PaymentMethodsPage />} />

          {/* Dettes Pompistes */}
          <Route path="/dettes" element={<DebtsPage />} />
          <Route path="/dettes/nouveau" element={<NewDebtPage />} />
          <Route path="/dettes/:id" element={<DebtDetailPage />} />

          {/* Alerts */}
          <Route path="/alertes" element={<AlertsPage />} />
          <Route path="/alertes/:id" element={<AlertDetailPage />} />

          {/* Profile */}
          <Route path="/profil" element={<PlaceholderPage title="Mon Profil" />} />

          {/* Admin only */}
          <Route path="/admin/licences" element={<PlaceholderPage title="Gestion des Licences" />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
