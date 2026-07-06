import { useState, useMemo } from 'react'
import Card, { CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import BalanceCard from '@/components/balances/BalanceCard'
import Avatar from '@/components/ui/Avatar'
import { useGroupStore } from '@/stores/useGroupStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { calculateGroupBalances, calculateDebts } from '@/utils/calculateBalances'
import { resolveGroupMembers } from '@/utils/groupMembers'
import { formatCurrency } from '@/utils/formatCurrency'

export default function BalancesPage() {
  const groups = useGroupStore((s) => s.groups)
  const allMembers = useGroupStore((s) => s.members)
  const allExpenses = useExpenseStore((s) => s.expenses)
  const [selectedGroup, setSelectedGroup] = useState('')

  // groups llega vacío en el primer render (carga async). En vez de sincronizar
  // estado con un efecto, derivamos el grupo activo cayendo al primero disponible
  // hasta que el usuario elija otro explícitamente.
  const activeGroup = selectedGroup || groups[0]?.id || ''

  const group = groups.find((g) => g.id === activeGroup)

  const groupMembers = useMemo(
    () => resolveGroupMembers(group, allMembers),
    [group, allMembers]
  )
  const groupExpenses = useMemo(
    () => allExpenses.filter((e) => e.groupId === activeGroup),
    [allExpenses, activeGroup]
  )
  const balances = useMemo(
    () => calculateGroupBalances(groupExpenses, groupMembers),
    [groupExpenses, groupMembers]
  )
  const debts = useMemo(() => calculateDebts(balances), [balances])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-accent-500 dark:text-accent-400 tracking-tight">Balances</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Revisá quién le debe a quién en cada grupo</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No tenés grupos todavía"
          description="Creá un grupo para empezar a registrar gastos y ver los balances."
        />
      ) : (
        <Select
          id="balance-group"
          value={activeGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="w-full sm:w-64"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
          ))}
        </Select>
      )}

      {group && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Balances individuales</h3>
            </CardHeader>
            <ul className="divide-y divide-surface-100 dark:divide-primary-700/15">
              {groupMembers.map((member) => {
                const balance = balances[member.id]?.balance || 0
                return (
                  <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={member.name} src={member.avatar} size="md" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{member.name}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">
                        {balance >= 0 ? 'A favor' : 'En deuda'}
                      </p>
                    </div>
                    <span className={`text-base font-bold ${balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Deudas pendientes</h3>
            </CardHeader>
            {debts.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Todo saldado"
                  description="No hay deudas pendientes en este grupo."
                />
              </div>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-primary-700/15">
                {debts.map((debt) => (
                  <BalanceCard key={`${debt.from.id}-${debt.to.id}`} debt={debt} groupId={activeGroup} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
