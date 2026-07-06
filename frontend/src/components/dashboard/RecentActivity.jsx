import { useMemo, useState } from 'react'
import Card, { CardBody } from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useActivityStore } from '@/stores/useActivityStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatRelativeDate } from '@/utils/dateFormat'
import { CATEGORIES } from '@/data/mockData'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguos' },
  { value: 'amount-desc', label: 'Mayor monto' },
  { value: 'amount-asc', label: 'Menor monto' },
]

export default function RecentActivity() {
  const expenses = useExpenseStore((s) => s.expenses)
  const members = useGroupStore((s) => s.members)
  const groups = useGroupStore((s) => s.groups)
  const activityEvents = useActivityStore((s) => s.events)
  const [sortBy, setSortBy] = useState('date-desc')

  const items = useMemo(() => {
    const expenseItems = expenses.map((e) => ({ ...e, _kind: 'expense' }))
    const eventItems = activityEvents.map((e) => ({ ...e, _kind: 'event', amount: 0 }))
    const all = [...expenseItems, ...eventItems]

    all.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.date) - new Date(b.date)
        case 'amount-desc': return b.amount - a.amount
        case 'amount-asc': return a.amount - b.amount
        default: return new Date(b.date) - new Date(a.date)
      }
    })

    return all.slice(0, 6)
  }, [expenses, activityEvents, sortBy])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-surface-900 dark:text-white">Actividad reciente</h3>
        {expenses.length > 0 && (
          <div className="flex rounded-xl border border-surface-200 dark:border-primary-700/20 overflow-hidden">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  sortBy === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-primary-600/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <Card>
      <CardBody className="p-0">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-surface-500 dark:text-surface-400">
            No hay actividad reciente. Agregá un gasto para verlo acá.
          </p>
        ) : (
        <ul className="divide-y divide-surface-100 dark:divide-primary-700/15">
          {items.map((item) => {
            if (item._kind === 'event' && item.type === 'group-deleted') {
              return (
                <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-danger-100 dark:bg-danger-900/30 shrink-0">
                    <svg className="w-4 h-4 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 dark:text-surface-300">
                      Se eliminó el grupo{' '}
                      <span className="font-semibold text-surface-900 dark:text-white">{item.groupEmoji} {item.groupName}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-surface-400 dark:text-surface-500">{formatRelativeDate(item.date)}</p>
                  </div>
                </li>
              )
            }

            const expense = item
            const payer = members.find((m) => m.id === expense.paidBy)
            const group = groups.find((g) => g.id === expense.groupId)
            const isSettlement = expense.category === 'settlement'

            if (isSettlement) {
              const receiver = members.find((m) => expense.splitBetween.includes(m.id))
              return (
                <li key={expense.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success-100 dark:bg-success-900/30 shrink-0">
                    <svg className="w-4 h-4 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-700 dark:text-surface-300">
                      <span className="font-semibold text-surface-900 dark:text-white">{payer?.name}</span>
                      {' '}le pagó a{' '}
                      <span className="font-semibold text-surface-900 dark:text-white">{receiver?.name}</span>
                    </p>
                    <span className="text-xs text-surface-500 dark:text-surface-400">{group?.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-success-600">{formatCurrency(expense.amount)}</p>
                    <p className="text-xs text-surface-400 dark:text-surface-500">{formatRelativeDate(expense.date)}</p>
                  </div>
                </li>
              )
            }

            const category = CATEGORIES[expense.category] || CATEGORIES.otros
            return (
              <li key={expense.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={payer?.name || '?'} src={payer?.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                      {expense.description}
                    </p>
                    <Badge className={`shrink-0 ${category.color}`}>{category.label}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-surface-500 dark:text-surface-400">
                      {payer?.name} &middot; {group?.name}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">
                    {formatCurrency(expense.amount)}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">{formatRelativeDate(expense.date)}</p>
                </div>
              </li>
            )
          })}
        </ul>
        )}
      </CardBody>
    </Card>
    </div>
  )
}
