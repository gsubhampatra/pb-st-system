import React from 'react';

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}) {
  const isDisabled = disabled || loading;
  
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-md font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizes[size] || sizes.md,
        variants[variant] || variants.primary,
        isDisabled && 'opacity-60 cursor-not-allowed',
        className,
      ].join(' ')}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
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
      )}
      {children}
    </button>
  );
}
