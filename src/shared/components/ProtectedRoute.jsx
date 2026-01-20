/**
 * Protected Route Component
 * 
 * Route wrapper for role-based access control
 */

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasRole } from '../../features/auth/service.js';

/**
 * Protected Route component
 * @param {{children: React.ReactNode, requiredRole?: import('../../features/auth/types.js').UserRole}} props
 */
export function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
