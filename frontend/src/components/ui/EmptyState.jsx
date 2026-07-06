export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-surface-300 dark:text-surface-600 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-surface-500 dark:text-surface-400 mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  )
}
