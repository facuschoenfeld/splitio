import BalanceSummary from '@/components/dashboard/BalanceSummary'
import RecentActivity from '@/components/dashboard/RecentActivity'
import GroupOverview from '@/components/dashboard/GroupOverview'
import CategoryChart from '@/components/charts/CategoryChart'
import Button from '@/components/ui/Button'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { calculateGroupBalances } from '@/utils/calculateBalances'

export default function DashboardPage() {
  const expenses = useExpenseStore((s) => s.expenses)
  const groups = useGroupStore((s) => s.groups)
  const members = useGroupStore((s) => s.members)
  const openModal = useUIStore((s) => s.openModal)
  const user = useAuthStore((s) => s.user)

  let totalOwed = 0
  let totalOwe = 0

  groups.forEach((group) => {
    const groupExpenses = expenses.filter((e) => e.groupId === group.id)
    const groupMembers = members.filter((m) => group.members.includes(m.id))
    const balances = calculateGroupBalances(groupExpenses, groupMembers)
    const myBalance = balances[user?.id]?.balance || 0
    if (myBalance > 0) totalOwed += myBalance
    else totalOwe += Math.abs(myBalance)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-accent-500 dark:text-accent-400 tracking-tight">Dashboard</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Resumen de tus gastos compartidos</p>
        </div>
        <Button onClick={() => openModal('addExpense')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo gasto
        </Button>
      </div>

      <BalanceSummary totalOwed={totalOwed} totalOwe={totalOwe} netBalance={totalOwed - totalOwe} />

      <CategoryChart expenses={expenses} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <GroupOverview />
      </div>
    </div>
  )
}
