import { CATEGORIES } from '@/data/mockData'

// Suma los gastos por categoría para alimentar el gráfico. Ignora los
// 'settlement' (saldos de deuda) igual que el resto de agregaciones de la app,
// porque no son gastos reales. Devuelve un array ordenado desc por total con el
// label y color (hex) de cada categoría listos para ApexCharts.
export function aggregateByCategory(expenses) {
  const totals = {}

  expenses.forEach((expense) => {
    if (expense.category === 'settlement') return
    const key = CATEGORIES[expense.category] ? expense.category : 'otros'
    totals[key] = (totals[key] || 0) + parseFloat(expense.amount || 0)
  })

  return Object.entries(totals)
    .map(([key, total]) => ({
      key,
      label: CATEGORIES[key].label,
      hex: CATEGORIES[key].hex,
      total,
    }))
    .sort((a, b) => b.total - a.total)
}
