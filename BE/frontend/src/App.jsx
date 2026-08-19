import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './features/auth/contexts/AuthContext';

import ProtectedRoute from './shared/components/ProtectedRoute';

import LoginPage from './features/auth/components/LoginPage';
import RegisterPage from './features/auth/components/RegisterPage';

import HomePage from './pages/HomePage';
import AdminPanel from './pages/AdminPanel';
import PetsPage from './pages/pet/PetsPage';
import AddPetPage from './pages/pet/AddPetPage';
import EditPetPage from './pages/pet/EditPetPage';
import ClinicsPage from './pages/clinic/ClinicsPage';
import ClinicDetailsPage from './pages/clinic/ClinicDetailsPage';
import AddClinicPage from './pages/clinic/AddClinicPage';


function RootRedirect() {
  const { isAuthenticated } = useAuth();

  return (
    <Navigate
      to={isAuthenticated ? '/dashboard' : '/login'}
      replace
    />
  );
}


function AppRoutes() {
  return (
    <Routes>

      <Route
        path="/"
        element={<RootRedirect />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pets"
        element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <PetsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pets/new"
        element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <AddPetPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pets/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <EditPetPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminPanel />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/clinics/new"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AddClinicPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
      {/* CLINIC ROUTES */}

      <Route
        path="/clinics"
        element={
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <ClinicsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clinics/:id"
        element={
          <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
            <ClinicDetailsPage />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;