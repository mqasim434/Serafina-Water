/**
 * Header Component
 * 
 * Application header with language switcher and user menu
 */

import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../../features/i18n/slice.js';
import { logout } from '../../features/auth/slice.js';
import { i18nService } from '../../features/i18n/slice.js';
import { signOut } from '../../features/auth/service.js';
import { useTranslation } from '../../shared/hooks/useTranslation.js';

/**
 * Header component props
 * @typedef {Object} HeaderProps
 * @property {function} [onMenuClick] - Menu button click handler (mobile)
 */

/**
 * Header component
 * @param {HeaderProps} props
 */
export function Header({ onMenuClick }) {
  const dispatch = useDispatch();
  const { t, currentLanguage } = useTranslation();
  const { user } = useSelector((state) => state.auth);

  const handleLanguageChange = async (lang) => {
    const normalized = i18nService.normalizeLanguage(lang);
    dispatch(setLanguage(normalized));
    await i18nService.persistLanguage(normalized);
  };

  const handleLogout = async () => {
    await signOut();
    dispatch(logout());
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand and Mobile Menu */}
          <div className="flex items-center gap-4">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-900">{t('appName')}</h1>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  currentLanguage === 'en'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('ur')}
                className={`px-3 py-1.5 text-sm font-medium rounded ${
                  currentLanguage === 'ur'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                UR
              </button>
            </div>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user.displayName || user.username}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
