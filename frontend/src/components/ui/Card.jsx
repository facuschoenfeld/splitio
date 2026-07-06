export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white dark:bg-surface-900 rounded-2xl shadow-card dark:shadow-card-dark border border-transparent dark:border-primary-700/15 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-surface-100 dark:border-primary-700/15 ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}
