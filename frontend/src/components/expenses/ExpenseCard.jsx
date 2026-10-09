import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { useGroupStore } from '@/stores/useGroupStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/dateFormat'
import { CATEGORIES } from '@/data/mockData'

export default function ExpenseCard({ expense, members }) {
  const globalMembers = useGroupStore((s) => s.members)
  const user = useAuthStore((s) => s.user)
  const group = useGroupStore((s) => s.groups.find((g) => g.id === expense.groupId))
  const openModal = useUIStore((s) => s.openModal)
  // Si se pasan los miembros efectivos del grupo, se usan (para aplicar el
  // apodo dentro del grupo); si no, se cae a la lista global de usuarios.
  const resolvedMembers = members || globalMembers
  const payer = resolvedMembers.find((m) => m.id === expense.paidBy)
  const category = CATEGORIES[expense.category] || CATEGORIES.otros
  const isCurrentUserPayer = expense.paidBy === user?.id
  const splitAmount = expense.splitBetween?.length ? expense.amount / expense.splitBetween.length : expense.amount
  // Misma regla que el backend: solo quien pagó o el administrador del grupo.
  const canDelete = isCurrentUserPayer || (group && String(group.created_by) === String(user?.id))

  return (
    <div className="group flex items-center gap-3 px-4 py-3">
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
      {canDelete && (
        // En pantallas con mouse aparece solo al pasar por encima; en móvil queda siempre visible.
        <button
          type="button"
          onClick={() => openModal('deleteExpense', { expense })}
          className="shrink-0 p-1.5 rounded-lg text-surface-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
          aria-label={`Eliminar gasto ${expense.description}`}
          title="Eliminar gasto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      )}
    </div>
  )
}
