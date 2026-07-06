import Modal from '@/components/ui/Modal'
import { useUIStore } from '@/stores/useUIStore'
import AddExpenseForm from './AddExpenseForm'

export default function AddExpenseModal() {
  const activeModal = useUIStore((s) => s.activeModal)

  return (
    <Modal name="addExpense" title="Agregar gasto">
      {activeModal === 'addExpense' && <AddExpenseForm />}
    </Modal>
  )
}
