import { lazy, Suspense, useMemo } from 'react'
import Card, { CardHeader } from '@/components/ui/Card'
import EmptyState from '@/components/ui/EmptyState'
import { aggregateByCategory } from '@/utils/aggregateByCategory'
import { formatCurrency } from '@/utils/formatCurrency'
import { useThemeStore } from '@/stores/useThemeStore'

// ApexCharts pesa bastante; lo cargamos lazy para no inflar el bundle inicial.
const Chart = lazy(() => import('react-apexcharts'))

function ChartFallback() {
  return (
    <div className="flex items-center justify-center h-[320px]">
      <div className="w-8 h-8 rounded-full border-2 border-surface-200 dark:border-primary-700/30 border-t-primary-500 animate-spin" />
    </div>
  )
}

export default function CategoryChart({ expenses, title = 'Gastos por categoría', className = '' }) {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'

  const data = useMemo(() => aggregateByCategory(expenses), [expenses])

  const header = (
    <CardHeader>
      <h3 className="text-base font-semibold text-surface-900 dark:text-white">{title}</h3>
    </CardHeader>
  )

  if (data.length === 0) {
    return (
      <Card className={className}>
        {header}
        <EmptyState
          title="Sin datos para mostrar"
          description="Cuando registres gastos vas a ver acá en qué se reparte el dinero."
        />
      </Card>
    )
  }

  const total = data.reduce((sum, d) => sum + d.total, 0)
  const labelColor = isDark ? '#cbd5e1' : '#475569'
  const valueColor = isDark ? '#ffffff' : '#0f172a'

  const series = data.map((d) => d.total)
  const options = {
    chart: { type: 'donut', fontFamily: 'inherit' },
    labels: data.map((d) => d.label),
    colors: data.map((d) => d.hex),
    theme: { mode: isDark ? 'dark' : 'light' },
    stroke: { colors: [isDark ? '#0f172a' : '#ffffff'] },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Math.round(val)}%`,
      style: { fontSize: '11px', fontWeight: 600 },
      dropShadow: { enabled: false },
    },
    legend: {
      position: 'bottom',
      labels: { colors: labelColor },
      formatter: (label, opts) => {
        const value = opts.w.globals.series[opts.seriesIndex]
        return `${label} — ${formatCurrency(value)}`
      },
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      y: { formatter: (val) => formatCurrency(val) },
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: { color: labelColor },
            value: { color: valueColor, formatter: (val) => formatCurrency(Number(val)) },
            total: {
              show: true,
              label: 'Total',
              color: labelColor,
              formatter: () => formatCurrency(total),
            },
          },
        },
      },
    },
    responsive: [
      { breakpoint: 480, options: { legend: { position: 'bottom' } } },
    ],
  }

  return (
    <Card className={className}>
      {header}
      <div className="px-5 py-4">
        <Suspense fallback={<ChartFallback />}>
          <Chart options={options} series={series} type="donut" height={320} />
        </Suspense>
      </div>
    </Card>
  )
}
