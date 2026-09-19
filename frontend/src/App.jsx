import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage  from './pages/LandingPage';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Dashboard    from './pages/Dashboard';
import AdminPage    from './pages/AdminPage';
import GlobalCursor from './components/GlobalCursor';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <GlobalCursor />
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect to Landing Page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
