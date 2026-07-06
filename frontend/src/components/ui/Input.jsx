export default function Input({ label, id, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className="w-full rounded-xl border border-surface-200 dark:border-primary-700/20 bg-surface-50 dark:bg-surface-950/80 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 dark:focus:ring-primary-500/25 focus:outline-none transition-all"
        {...props}
      />
    </div>
  )
}

export function Select({ label, id, children, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className="w-full rounded-xl border border-surface-200 dark:border-primary-700/20 bg-surface-50 dark:bg-surface-950/80 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:border-primary-500 dark:focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 dark:focus:ring-primary-500/25 focus:outline-none transition-all"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
