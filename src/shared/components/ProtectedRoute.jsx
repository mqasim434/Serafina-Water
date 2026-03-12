/**
 * Protected Route Component
 *
 * Route wrapper for role-based access control
 * - requiredRole: only users with this role (admin, staff, driver) can access
 * - allowedRoles: users with any of these roles can access (admin always has access)
 */

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hasRole, hasAnyRole } from '../../features/auth/service.js';

/**
 * Protected Route component
 * @param {{children: React.ReactNode, requiredRole?: import('../../features/auth/types.js').UserRole, allowedRoles?: import('../../features/auth/types.js').UserRole[]}} props
 */
export function ProtectedRoute({ children, requiredRole, allowedRoles }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !hasAnyRole(user, allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
