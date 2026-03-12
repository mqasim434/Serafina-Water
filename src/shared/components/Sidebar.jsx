/**
 * Sidebar Component
 * 
 * Navigation sidebar with role-based menu items
 */

import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../hooks/useTranslation.js';
import { isAdmin, isDriver } from '../../features/auth/service.js';

/**
 * Navigation menu items by role
 * Admin: all tabs
 * Driver: Customers, Deliveries
 * Staff: Customers, Place Order, Return bottles, Deliveries, Stock, Payments, Expenses, Water Quality, Maintenance
 * @param {Object} user - Current user
 * @returns {Array<{path: string, label: string}>}
 */
function getMenuItems(user) {
  if (!user) return [];

  if (isAdmin(user)) {
    return [
      { path: '/', label: 'dashboard' },
      { path: '/customers', label: 'customers' },
      { path: '/place-orders', label: 'placeOrders' },
      { path: '/return-bottles', label: 'returnBottles' },
      { path: '/deliveries', label: 'deliveries' },
      { path: '/stock', label: 'stock' },
      { path: '/payments', label: 'payments' },
      { path: '/expenses', label: 'expenses' },
      { path: '/water-quality', label: 'waterQuality' },
      { path: '/maintenance', label: 'maintenance' },
      { path: '/payroll', label: 'payroll' },
      { path: '/products', label: 'products' },
      { path: '/users', label: 'users' },
      { path: '/reports', label: 'reports' },
      { path: '/settings', label: 'settings' },
    ];
  }

  if (isDriver(user)) {
    return [
      { path: '/', label: 'dashboard' },
      { path: '/customers', label: 'customers' },
      { path: '/deliveries', label: 'deliveries' },
    ];
  }

  // Staff
  return [
    { path: '/', label: 'dashboard' },
    { path: '/customers', label: 'customers' },
    { path: '/place-orders', label: 'placeOrders' },
    { path: '/return-bottles', label: 'returnBottles' },
    { path: '/deliveries', label: 'deliveries' },
    { path: '/stock', label: 'stock' },
    { path: '/payments', label: 'payments' },
    { path: '/expenses', label: 'expenses' },
    { path: '/water-quality', label: 'waterQuality' },
    { path: '/maintenance', label: 'maintenance' },
  ];
}

/**
 * Sidebar component props
 * @typedef {Object} SidebarProps
 * @property {boolean} isOpen - Whether sidebar is open (mobile)
 * @property {function} onClose - Close handler (mobile)
 */

/**
 * Sidebar component
 * @param {SidebarProps} props
 */
export function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const menuItems = getMenuItems(user);

  return (
    <aside
      className={`bg-white border-r border-gray-200 w-64 h-[calc(100vh-4rem)] fixed left-0 top-16 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {t(item.label)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
