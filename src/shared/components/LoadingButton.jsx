/**
 * LoadingButton – Action button with loading spinner + disabled state
 */

export function LoadingSpinner({ className = 'h-5 w-5' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Base variant classes
const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
  danger: 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed',
  success: 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed',
  warning: 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'border border-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed',
};

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button label
 * @param {boolean} [props.isLoading] - Show spinner and disable
 * @param {boolean} [props.disabled] - Disable button
 * @param {'button'|'submit'} [props.type] - Button type
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.className] - Additional classes
 * @param {'primary'|'secondary'|'danger'|'success'|'warning'|'ghost'} [props.variant] - Button style
 * @param {'md'|'sm'} [props.size] - Button size (sm = compact)
 */
export function LoadingButton({
  children,
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  variant = 'primary',
  size = 'md',
}) {
  const isDisabled = isLoading || disabled;
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs min-w-0' : 'px-4 py-2 min-w-[100px]';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${sizeClasses} ${VARIANTS[variant] || VARIANTS.primary} ${className}`}
    >
      {isLoading && <LoadingSpinner className={size === 'sm' ? 'h-4 w-4 shrink-0' : 'h-5 w-5 shrink-0'} />}
      {children}
    </button>
  );
}
