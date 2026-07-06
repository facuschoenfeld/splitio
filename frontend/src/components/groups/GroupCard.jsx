import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import { useGroupStore } from '@/stores/useGroupStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { calculateGroupBalances, calculateDebts } from '@/utils/calculateBalances'

export default function GroupCard({ group }) {
  const members = useGroupStore((s) => s.members)
  const expenses = useExpenseStore((s) => s.expenses)

  // Memoizamos los arrays derivados: sin esto cada render genera nuevas referencias
  // y el useMemo de hasDebts se recalcula siempre, anulando su propósito.
  const groupMembers = useMemo(
    () => members.filter((m) => group.members.includes(m.id)),
    [members, group.members]
  )
  const groupExpenses = useMemo(
    () => expenses.filter((e) => e.groupId === group.id),
    [expenses, group.id]
  )
  const total = groupExpenses
    .filter((e) => e.category !== 'settlement')
    .reduce((sum, e) => sum + e.amount, 0)
  const hasDebts = useMemo(() => {
    const balances = calculateGroupBalances(groupExpenses, groupMembers)
    return calculateDebts(balances).length > 0
  }, [groupExpenses, groupMembers])

  return (
    <Link to={`/grupos/${group.id}`}>
      <Card className="p-5 hover:scale-[1.01] hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{group.emoji}</span>
          <span className="text-sm font-semibold text-surface-900 dark:text-white">{formatCurrency(total)}</span>
        </div>
        <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-1">{group.name}</h3>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-2 line-clamp-1">{group.description}</p>
        {groupExpenses.length > 0 && (
          <p className={`text-xs font-medium mb-2 ${hasDebts ? 'text-danger-600' : 'text-success-600'}`}>
            {hasDebts ? 'Deudas pendientes' : 'Sin deudas'}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {groupMembers.slice(0, 4).map((member) => (
              <Avatar key={member.id} name={member.name} src={member.avatar} size="sm" className="ring-2 ring-white dark:ring-surface-900" />
            ))}
            {groupMembers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-surface-100 text-surface-500 dark:text-surface-400 text-xs font-medium flex items-center justify-center ring-2 ring-white dark:ring-surface-900">
                +{groupMembers.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-surface-400">{groupMembers.length} miembros</span>
        </div>
      </Card>
    </Link>
  )
}
