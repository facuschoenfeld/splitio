import Card from '@/components/ui/Card'
import { formatCurrency } from '@/utils/formatCurrency'

function StatCard({ label, amount, colorClass, bgClass, icon }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
            {label}
          </p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${colorClass}`}>
            {formatCurrency(amount)}
          </p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${bgClass}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

export default function BalanceSummary({ totalOwed, totalOwe, netBalance }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Te deben"
        amount={totalOwed}
        colorClass="text-success-600 dark:text-success-500"
        bgClass="bg-success-50 dark:bg-success-500/15"
        icon={
          <svg className="w-5 h-5 text-success-600 dark:text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
          </svg>
        }
      />
      <StatCard
        label="Debés"
        amount={totalOwe}
        colorClass="text-danger-600 dark:text-danger-500"
        bgClass="bg-danger-50 dark:bg-danger-500/15"
        icon={
          <svg className="w-5 h-5 text-danger-600 dark:text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
          </svg>
        }
      />
      <StatCard
        label="Balance neto"
        amount={Math.abs(netBalance)}
        colorClass={netBalance >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500'}
        bgClass="bg-accent-50 dark:bg-accent-500/15"
        icon={
          <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        }
      />
    </div>
  )
}
