import { useState } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { useUIStore } from '@/stores/useUIStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { formatCurrency } from '@/utils/formatCurrency'

export default function SettleDebtModal() {
  const { activeModal, modalData: debt, closeModal } = useUIStore()
  const settleDebt = useExpenseStore((s) => s.settleDebt)
  const [loading, setLoading] = useState(false)

  if (activeModal !== 'settleDebt' || !debt) return null

  async function handleConfirm() {
    setLoading(true)
    try {
      await settleDebt({
        groupId: debt.groupId,
        fromUserId: debt.from.id,
        toUserId: debt.to.id,
        amount: debt.amount,
      })
      setLoading(false)
      closeModal()
      toast.success('Deuda saldada', { description: `${debt.from.name} pagó ${formatCurrency(debt.amount)} a ${debt.to.name}` })
    } catch {
      setLoading(false)
      toast.error('Error al saldar la deuda')
    }
  }

  return (
    <Modal name="settleDebt" title="Saldar deuda">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <Avatar name={debt.from.name} src={debt.from.avatar} size="lg" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300 mt-2">{debt.from.name}</span>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span className="text-xs text-surface-400 mt-1">paga a</span>
          </div>
          <div className="flex flex-col items-center">
            <Avatar name={debt.to.name} src={debt.to.avatar} size="lg" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300 mt-2">{debt.to.name}</span>
          </div>
        </div>
        <p className="text-3xl font-bold text-surface-900 dark:text-white">{formatCurrency(debt.amount)}</p>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Esta acción registrará el pago y actualizará los balances del grupo.
        </p>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={closeModal} disabled={loading}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Procesando...' : 'Confirmar pago'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
