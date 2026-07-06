import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import ExpenseCard from '@/components/expenses/ExpenseCard'
import CategoryChart from '@/components/charts/CategoryChart'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUIStore } from '@/stores/useUIStore'
import { CATEGORIES } from '@/data/mockData'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguos' },
  { value: 'amount-desc', label: 'Mayor monto' },
  { value: 'amount-asc', label: 'Menor monto' },
]

// Normaliza para búsquedas insensibles a mayúsculas y acentos.
const normalize = (str) =>
  (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export default function ExpensesPage() {
  const expenses = useExpenseStore((s) => s.expenses)
  const groups = useGroupStore((s) => s.groups)
  const members = useGroupStore((s) => s.members)
  const openModal = useUIStore((s) => s.openModal)
  const [filterGroup, setFilterGroup] = useState('')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')

  const regularExpenses = expenses.filter((e) => e.category !== 'settlement')
  const byGroup = filterGroup
    ? regularExpenses.filter((e) => e.groupId === filterGroup)
    : regularExpenses

  const q = normalize(query.trim())
  const filtered = q
    ? byGroup.filter((e) => {
        const payer = members.find((m) => m.id === e.paidBy)
        const categoryLabel = (CATEGORIES[e.category] || CATEGORIES.otros).label
        const group = groups.find((g) => g.id === e.groupId)
        const nickname = group?.memberOverrides?.[e.paidBy]?.nickname
        return (
          normalize(e.description).includes(q) ||
          normalize(payer?.name).includes(q) ||
          normalize(nickname).includes(q) ||
          normalize(categoryLabel).includes(q)
        )
      })
    : byGroup

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc': return new Date(a.date) - new Date(b.date)
      case 'amount-desc': return b.amount - a.amount
      case 'amount-asc': return a.amount - b.amount
      default: return new Date(b.date) - new Date(a.date)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-accent-500 dark:text-accent-400 tracking-tight">Gastos</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Todos tus gastos compartidos</p>
        </div>
        <Button onClick={() => openModal('addExpense')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo gasto
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          id="search-expenses"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por descripción, pagador o categoría..."
          className="w-full sm:flex-1"
        />
        <Select
          id="filter-group"
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="w-full sm:w-64"
        >
          <option value="">Todos los grupos</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
          ))}
        </Select>
        <div className="flex rounded-xl border border-surface-200 dark:border-primary-700/20 overflow-hidden">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                sortBy === opt.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-surface-900 text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-primary-600/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 && <CategoryChart expenses={filtered} />}

      {sorted.length === 0 ? (
        q ? (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            }
            title="Sin resultados"
            description={`No se encontraron gastos para «${query.trim()}».`}
          />
        ) : (
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            }
            title="No hay gastos"
            description="Agregá tu primer gasto para empezar a llevar el control."
            action={<Button onClick={() => openModal('addExpense')}>Agregar gasto</Button>}
          />
        )
      ) : (
        <Card>
          <div className="divide-y divide-surface-100 dark:divide-primary-700/15">
            {sorted.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
