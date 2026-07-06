const variants = {
  primary:
    'bg-gradient-to-br from-primary-500 to-primary-700 text-white hover:from-primary-600 hover:to-primary-800 shadow-glow-primary dark:shadow-glow-primary-dark',
  secondary:
    'bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-primary-700/25 hover:bg-surface-50 dark:hover:bg-surface-700 shadow-card dark:shadow-card-dark',
  danger:
    'bg-gradient-to-br from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700 shadow-sm',
  ghost:
    'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-primary-600/10 hover:text-surface-800 dark:hover:text-surface-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
