import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import ExpenseCard from '@/components/expenses/ExpenseCard'
import BalanceCard from '@/components/balances/BalanceCard'
import InviteMembersModal from '@/components/groups/InviteMembersModal'
import { useGroupStore } from '@/stores/useGroupStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/dateFormat'
import { calculateGroupBalances, calculateDebts } from '@/utils/calculateBalances'
import { resolveGroupMembers } from '@/utils/groupMembers'
import { api, downloadFile } from '@/api/client'

export default function GroupDetailPage() {
  const { id } = useParams()
  const groups = useGroupStore((s) => s.groups)
  const allMembers = useGroupStore((s) => s.members)
  const allExpenses = useExpenseStore((s) => s.expenses)
  const openModal = useUIStore((s) => s.openModal)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [summaryStatus, setSummaryStatus] = useState('idle')
  const [downloadStatus, setDownloadStatus] = useState('idle')
  const [summaryMenuOpen, setSummaryMenuOpen] = useState(false)
  const summaryMenuRef = useRef(null)
  const [sortBy, setSortBy] = useState('date-desc')

  // Cierra el menú de resumen al clickear fuera.
  useEffect(() => {
    if (!summaryMenuOpen) return
    function handleClickOutside(e) {
      if (summaryMenuRef.current && !summaryMenuRef.current.contains(e.target)) {
        setSummaryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [summaryMenuOpen])

  const group = groups.find((g) => g.id === id)
  const members = useMemo(
    () => resolveGroupMembers(group, allMembers),
    [group, allMembers]
  )
  const isAdmin = group?.created_by === user?.id
  const allGroupExpenses = useMemo(
    () => allExpenses.filter((e) => e.groupId === id),
    [allExpenses, id]
  )
  const expenses = useMemo(
    () => allGroupExpenses.filter((e) => e.category !== 'settlement'),
    [allGroupExpenses]
  )
  const settlements = useMemo(
    () => allGroupExpenses.filter((e) => e.category === 'settlement').sort((a, b) => new Date(b.date) - new Date(a.date)),
    [allGroupExpenses]
  )
  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.date) - new Date(b.date)
        case 'amount-desc': return b.amount - a.amount
        case 'amount-asc': return a.amount - b.amount
        default: return new Date(b.date) - new Date(a.date)
      }
    })
  }, [expenses, sortBy])
  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  )
  const balances = useMemo(
    () => calculateGroupBalances(allGroupExpenses, members),
    [allGroupExpenses, members]
  )
  const debts = useMemo(() => calculateDebts(balances), [balances])

  const handleDeleteGroup = useCallback(() => {
    if (debts.length > 0) {
      toast.error('No se puede eliminar el grupo', {
        description: 'Hay deudas pendientes. Saldá todas las deudas antes de eliminar el grupo.',
      })
      return
    }
    openModal('deleteGroup', { group, onDeleted: () => navigate('/grupos') })
  }, [debts, group, openModal, navigate])

  async function handleSendSummary() {
    setSummaryMenuOpen(false)
    setSummaryStatus('loading')
    try {
      await api(`/groups/${id}/summary`, { method: 'POST' })
      setSummaryStatus('sent')
      toast.success('Resumen enviado', { description: 'Se envió el resumen del grupo a tu email' })
      setTimeout(() => setSummaryStatus('idle'), 3000)
    } catch {
      setSummaryStatus('error')
      toast.error('Error al enviar el resumen')
      setTimeout(() => setSummaryStatus('idle'), 3000)
    }
  }

  async function handleDownloadSummary() {
    setSummaryMenuOpen(false)
    setDownloadStatus('loading')
    try {
      await downloadFile(`/groups/${id}/summary/pdf`, `resumen-${group.name}.pdf`)
      toast.success('Resumen descargado')
    } catch (err) {
      toast.error(err.message || 'Error al descargar el resumen')
    } finally {
      setDownloadStatus('idle')
    }
  }

  if (!group) {
    return (
      <EmptyState
        title="Grupo no encontrado"
        description="El grupo que buscás no existe."
        action={<Link to="/grupos"><Button variant="secondary">Volver a grupos</Button></Link>}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/grupos" className="p-2 -ml-2 rounded-lg text-surface-400 dark:text-surface-500 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <span className="text-3xl">{group.emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-accent-500 dark:text-accent-400">{group.name}</h1>
            {isAdmin && (
              <>
                <button
                  onClick={() => openModal('editGroup', group)}
                  className="p-1.5 rounded-lg text-surface-400 dark:text-surface-500 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                  </svg>
                </button>
                <button
                  onClick={handleDeleteGroup}
                  className="p-1.5 rounded-lg text-surface-400 dark:text-surface-500 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <p className="text-sm text-surface-500 dark:text-surface-400">{group.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={summaryMenuRef}>
            <Button
              variant="secondary"
              onClick={() => setSummaryMenuOpen((o) => !o)}
              disabled={summaryStatus === 'loading' || downloadStatus === 'loading'}
            >
              {summaryStatus === 'loading' || downloadStatus === 'loading' ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              )}
              <span className="hidden sm:inline">Resumen</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </Button>
            {summaryMenuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-lg py-1">
                <button
                  onClick={handleSendSummary}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  Enviar por email
                </button>
                <button
                  onClick={handleDownloadSummary}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700/50 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Descargar PDF
                </button>
              </div>
            )}
          </div>
          <Button onClick={() => openModal('addExpense', { groupId: id })}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Agregar gasto</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Total gastado</p>
          <p className="text-lg font-bold text-surface-900 dark:text-white mt-1">{formatCurrency(total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Gastos</p>
          <p className="text-lg font-bold text-surface-900 dark:text-white mt-1">{expenses.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Miembros</p>
          <p className="text-lg font-bold text-surface-900 dark:text-white mt-1">{members.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Promedio</p>
          <p className="text-lg font-bold text-surface-900 dark:text-white mt-1">
            {formatCurrency(expenses.length ? total / expenses.length : 0)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">Gastos del grupo</h3>
            {expenses.length > 0 && (
              <div className="flex rounded-xl border border-surface-200 dark:border-primary-700/20 overflow-hidden">
                {[
                  { value: 'date-desc', label: 'Más recientes' },
                  { value: 'date-asc', label: 'Más antiguos' },
                  { value: 'amount-desc', label: 'Mayor monto' },
                  { value: 'amount-asc', label: 'Menor monto' },
                ].map((opt) => (
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
            {expenses.length === 0 ? (
              <CardBody>
                <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-4">No hay gastos registrados aún.</p>
              </CardBody>
            ) : (
              <div className="divide-y divide-surface-100 dark:divide-primary-700/15">
                {sortedExpenses.map((expense) => (
                  <ExpenseCard key={expense.id} expense={expense} members={members} />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-surface-900 dark:text-white">Miembros</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal('inviteMembers', { groupId: id, isAdmin })}
                    className="p-1.5 rounded-lg text-surface-400 dark:text-surface-500 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
                    title="Invitar al grupo"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => openModal('editMember', { groupId: id, groupMembers: members })}
                      className="p-1.5 rounded-lg text-surface-400 dark:text-surface-500 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
                      title="Editar miembros"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              <ul className="divide-y divide-surface-100 dark:divide-primary-700/15">
                {members.map((member) => {
                  const balance = balances[member.id]?.balance || 0
                  return (
                    <li key={member.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={member.name} src={member.avatar} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{member.name}</span>
                        {(member.payment_alias || member.cbu) && (
                          <p className="text-xs text-surface-400 dark:text-surface-500 truncate">
                            {member.payment_alias || member.cbu}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm font-semibold ${balance >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                        {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </CardBody>
          </Card>

          {debts.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold text-surface-900 dark:text-white">Deudas pendientes</h3>
              </CardHeader>
              <div className="divide-y divide-surface-100 dark:divide-primary-700/15">
                {debts.map((debt) => (
                  <BalanceCard key={`${debt.from.id}-${debt.to.id}`} debt={debt} groupId={id} />
                ))}
              </div>
            </Card>
          )}

          {settlements.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-base font-semibold text-surface-900 dark:text-white">Actividades</h3>
              </CardHeader>
              <ul className="divide-y divide-surface-100 dark:divide-primary-700/15">
                {settlements.map((s) => {
                  const payer = members.find((m) => m.id === s.paidBy)
                  const receiver = members.find((m) => s.splitBetween.includes(m.id))
                  return (
                    <li key={s.id} className="flex items-center gap-3 px-5 py-3">
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
                        <p className="text-xs text-surface-400 mt-0.5">{formatDate(s.date)}</p>
                      </div>
                      <span className="text-sm font-bold text-success-600 shrink-0">{formatCurrency(s.amount)}</span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <InviteMembersModal />
    </div>
  )
}
