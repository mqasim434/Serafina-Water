/**
 * App Component
 * 
 * Main application component with routing
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layout } from './shared/components/Layout.jsx';
import { ProtectedRoute } from './shared/components/ProtectedRoute.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Login } from './pages/Login.jsx';
import { Customers } from './pages/Customers.jsx';
import { Bottles } from './pages/Bottles.jsx';
import { Products } from './pages/Products.jsx';
import { Users } from './pages/Users.jsx';
import { Payments } from './pages/Payments.jsx';
import { CashManagement } from './pages/CashManagement.jsx';
import { Expenses } from './pages/Expenses.jsx';
import { Reports } from './pages/Reports.jsx';
import { Settings } from './pages/Settings.jsx';
import { setUser, setToken, setLoading } from './features/auth/slice.js';
import { getCurrentAuthUser, loadToken } from './features/auth/service.js';
import { setLanguage } from './features/i18n/slice.js';
import { loadLanguage } from './features/i18n/service.js';
import { initializeDefaultAdmin } from './features/users/init.js';

function AppRoutes() {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
  const { currentLanguage } = useSelector((state) => state.i18n);

  // Initialize app - load persisted data
  useEffect(() => {
    async function initializeApp() {
      try {
        // Initialize default admin if no users exist
        await initializeDefaultAdmin();
        
        // Load language preference
        const savedLanguage = await loadLanguage();
        dispatch(setLanguage(savedLanguage));

        // Load initial auth data
        const savedUser = await getCurrentAuthUser();
        const savedToken = await loadToken();
        
        if (savedUser && savedToken) {
          dispatch(setUser(savedUser));
          dispatch(setToken(savedToken));
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        // Still set loading to false so app doesn't hang
      } finally {
        dispatch(setLoading(false));
      }
    }

    initializeApp();
  }, [dispatch]);

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public route */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Customer Management */}
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <Customers />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bottles"
        element={
          <ProtectedRoute>
            <Layout>
              <Bottles />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;