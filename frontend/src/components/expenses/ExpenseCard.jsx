import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/dateFormat'
import { CATEGORIES } from '@/data/mockData'

export default function ExpenseCard({ expense, members }) {
  const globalMembers = useGroupStore((s) => s.members)
  const user = useAuthStore((s) => s.user)
  // Si se pasan los miembros efectivos del grupo, se usan (para aplicar el
  // apodo dentro del grupo); si no, se cae a la lista global de usuarios.
  const resolvedMembers = members || globalMembers
  const payer = resolvedMembers.find((m) => m.id === expense.paidBy)
  const category = CATEGORIES[expense.category] || CATEGORIES.otros
  const isCurrentUserPayer = expense.paidBy === user?.id
  const splitAmount = expense.splitBetween?.length ? expense.amount / expense.splitBetween.length : expense.amount

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar name={payer?.name || '?'} src={payer?.avatar} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{expense.description}</p>
          <Badge className={`shrink-0 ${category.color}`}>{category.label}</Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-surface-500 dark:text-surface-400">
            Pagó {isCurrentUserPayer ? 'tú' : payer?.name}
          </span>
        </div>
        <p className="text-xs text-surface-400 mt-0.5">{formatDate(expense.date)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-surface-900 dark:text-white">{formatCurrency(expense.amount)}</p>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          {formatCurrency(splitAmount)}/persona
        </p>
      </div>
    </div>
  )
}
