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
import AdminClinicsPage from './pages/AdminClinicsPage';
import AdminClinicDetailsPage from './pages/AdminClinicDetailsPage';
import BookAppointmentPage from './pages/appointment/BookAppointmentPage';
import VeterinarianSchedulePage from './pages/veterinarian/VeterinarianSchedulePage';
import VeterinarianAppointmentsPage from './pages/veterinarian/VeterinarianAppointmentsPage';
import SettingsPage from './pages/settings/SettingsPage';
import PetMedicalHistoryPage from './pages/pet/PetMedicalHistoryPage';
import VeterinarianMedicalRecordPage from './pages/veterinarian/VeterinarianMedicalRecordPage';
import VeterinarianPetHistoryPage from './pages/veterinarian/VeterinarianPetHistoryPage';

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
          <ProtectedRoute allowedRoles={['VETERINARIAN', 'ADMIN']}>
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
        path="/admin/clinics"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminClinicsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/clinics/:id"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminClinicDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

      {/* APPOINTMENT ROUTES */}
      <Route
        path="/appointments/new"
        element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <BookAppointmentPage />
          </ProtectedRoute>
        }
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

      <Route
        path="/veterinarian/schedule"
        element={
          <ProtectedRoute allowedRoles={['VETERINARIAN']}>
            <VeterinarianSchedulePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/veterinarian/appointments"
        element={
          <ProtectedRoute allowedRoles={['VETERINARIAN']}>
            <VeterinarianAppointmentsPage />
          </ProtectedRoute>
        }
      />


      {/* SETTINGS ROUTES */}

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      /> */}


      {/* MEDICALR ROUTES */}

      <Route
        path="/pets/:id/medical-history"
        element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <PetMedicalHistoryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/veterinarian/appointments/:appointmentId/medical-record"
        element={
          <ProtectedRoute allowedRoles={['VETERINARIAN']}>
            <VeterinarianMedicalRecordPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/veterinarian/pets/:petId/medical-history/:appointmentId"
        element={
          <ProtectedRoute allowedRoles={['VETERINARIAN']}>
            <VeterinarianPetHistoryPage />
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