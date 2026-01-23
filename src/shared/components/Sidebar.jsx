/**
 * Sidebar Component
 * 
 * Navigation sidebar with role-based menu items
 */

import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../hooks/useTranslation.js';
import { isAdmin } from '../../features/auth/service.js';

/**
 * Navigation menu items
 * @param {boolean} isAdminUser - Whether user is admin
 * @returns {Array<{path: string, label: string, adminOnly?: boolean}>}
 */
function getMenuItems(isAdminUser) {
  const items = [
    { path: '/', label: 'dashboard' },
    { path: '/customers', label: 'customers' },
    { path: '/bottles', label: 'bottles' },
    { path: '/payments', label: 'payments' },
    { path: '/water-quality', label: 'waterQuality' },
  ];

  if (isAdminUser) {
    items.push(
      { path: '/products', label: 'products', adminOnly: true },
      { path: '/users', label: 'users', adminOnly: true },
      { path: '/reports', label: 'reports', adminOnly: true },
      { path: '/settings', label: 'settings', adminOnly: true }
    );
  }

  return items;
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
  const isAdminUser = isAdmin(user);
  const menuItems = getMenuItems(isAdminUser);

  return (
    <aside
      className={`bg-white border-r border-gray-200 w-64 min-h-screen fixed left-0 top-16 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
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
