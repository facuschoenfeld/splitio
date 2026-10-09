import { useState } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useUIStore } from '@/stores/useUIStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { formatCurrency } from '@/utils/formatCurrency'

export default function DeleteExpenseModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const deleteExpense = useExpenseStore((s) => s.deleteExpense)
  const [loading, setLoading] = useState(false)

  const expense = modalData?.expense

  if (activeModal !== 'deleteExpense' || !expense) return null

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteExpense(expense.id)
      closeModal()
      toast.success('Gasto eliminado', {
        description: `"${expense.description}" fue eliminado y los balances se actualizaron`,
      })
    } catch (err) {
      toast.error('Error al eliminar el gasto', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal name="deleteExpense" title="Eliminar gasto">
      <div className="text-center space-y-4">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30">
          <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-surface-900 dark:text-white">
            ¿Eliminar "{expense.description}" ({formatCurrency(expense.amount)})?
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Los balances del grupo se recalcularán sin este gasto. Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={closeModal} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar gasto'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
