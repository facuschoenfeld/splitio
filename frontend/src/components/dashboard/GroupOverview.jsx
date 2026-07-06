import { Link } from 'react-router-dom'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import { useGroupStore } from '@/stores/useGroupStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { formatCurrency } from '@/utils/formatCurrency'

export default function GroupOverview() {
  const groups = useGroupStore((s) => s.groups)
  const expenses = useExpenseStore((s) => s.expenses)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">Mis grupos</h3>
          <Link to="/grupos" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Ver todos
          </Link>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {groups.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center text-surface-500 dark:text-surface-400">
            Todavía no tenés grupos. Creá uno para empezar a compartir gastos.
          </p>
        ) : (
        <ul className="divide-y divide-surface-100 dark:divide-primary-700/15">
          {groups.map((group) => {
            const total = expenses
              .filter((e) => e.groupId === group.id)
              .reduce((sum, e) => sum + e.amount, 0)
            return (
              <li key={group.id}>
                <Link
                  to={`/grupos/${group.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50 dark:hover:bg-primary-600/10 transition-colors"
                >
                  <span className="text-2xl">{group.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{group.name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{group.members.length} miembros</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-surface-700 dark:text-surface-300">
                      {formatCurrency(total)}
                    </p>
                    <p className="text-xs text-surface-400">total</p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
        )}
      </CardBody>
    </Card>
  )
}
