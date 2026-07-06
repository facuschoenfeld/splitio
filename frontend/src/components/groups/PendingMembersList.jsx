import Button from '@/components/ui/Button'

export default function PendingMembersList({ newMembers, inviteEmails, onRemoveMember, onRemoveEmail }) {
  if (!newMembers.length && !inviteEmails.length) return null

  return (
    <div className="space-y-1.5">
      {newMembers.map((m) => (
        <div
          key={m.tempId}
          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 inline-flex items-center rounded-md bg-primary-100 dark:bg-primary-800 px-1.5 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
              Nuevo
            </span>
            <span className="text-sm text-surface-700 dark:text-surface-300 truncate">
              {m.name}
              {m.email && <span className="text-surface-400 ml-1">({m.email})</span>}
              {m.payment_alias && <span className="text-primary-500 ml-1">· {m.payment_alias}</span>}
            </span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveMember(m.tempId)}>
            &times;
          </Button>
        </div>
      ))}
      {inviteEmails.map((email) => (
        <div
          key={email}
          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 inline-flex items-center rounded-md bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 text-xs font-medium text-surface-600 dark:text-surface-300">
              Invitado
            </span>
            <span className="text-sm text-surface-700 dark:text-surface-300 truncate">{email}</span>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveEmail(email)}>
            &times;
          </Button>
        </div>
      ))}
    </div>
  )
}
