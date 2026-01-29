import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout, PompisteLayout, AuthLayout } from '@/layouts';
import {
  LoginPage,
  LoginEmailForm,
  LoginBadgeForm,
  DashboardPage,
  PompisteDashboard,
  PlaceholderPage,
} from '@/pages';
import { useAuthStore } from '@/stores/authStore';

// Protected Route wrapper with role check
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('POMPISTE' | 'GESTIONNAIRE' | 'SUPER_ADMIN')[];
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
          <Route path="/pompiste" element={<PompisteDashboard />} />
          <Route
            path="/pompiste/shift"
            element={<PlaceholderPage title="Gestion du Shift" description="Demarrez ou terminez votre shift ici." />}
          />
          <Route
            path="/pompiste/vente"
            element={<PlaceholderPage title="Nouvelle Vente" description="Enregistrez une nouvelle vente de carburant." />}
          />
          <Route
            path="/pompiste/caisse"
            element={<PlaceholderPage title="Cloture de Caisse" description="Effectuez la cloture de votre caisse." />}
          />
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

          {/* Operations */}
          <Route path="/shifts" element={<PlaceholderPage title="Gestion des Shifts" />} />
          <Route path="/ventes" element={<PlaceholderPage title="Ventes" />} />
          <Route path="/stock" element={<PlaceholderPage title="Stock" />} />
          <Route path="/livraisons" element={<PlaceholderPage title="Livraisons" />} />
          <Route path="/clients" element={<PlaceholderPage title="Clients" />} />
          <Route path="/factures" element={<PlaceholderPage title="Factures" />} />

          {/* Configuration */}
          <Route path="/stations" element={<PlaceholderPage title="Stations" />} />
          <Route path="/cuves" element={<PlaceholderPage title="Cuves" />} />
          <Route path="/distributeurs" element={<PlaceholderPage title="Distributeurs" />} />
          <Route path="/pompistes" element={<PlaceholderPage title="Pompistes" />} />
          <Route path="/prix" element={<PlaceholderPage title="Prix du Carburant" />} />

          {/* Alerts */}
          <Route path="/alertes" element={<PlaceholderPage title="Alertes" />} />

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
