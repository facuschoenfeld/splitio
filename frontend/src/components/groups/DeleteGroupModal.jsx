import { useState } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useUIStore } from '@/stores/useUIStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useActivityStore } from '@/stores/useActivityStore'
import { api } from '@/api/client'

export default function DeleteGroupModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const deleteGroup = useGroupStore((s) => s.deleteGroup)
  const addEvent = useActivityStore((s) => s.addEvent)
  const [step, setStep] = useState('confirm')
  const [loading, setLoading] = useState(false)

  const group = modalData?.group
  const onDeleted = modalData?.onDeleted

  if (activeModal !== 'deleteGroup' || !group) return null

  function handleClose() {
    closeModal()
    setTimeout(() => setStep('confirm'), 200)
  }

  async function handleDelete(sendSummary) {
    setLoading(true)
    try {
      if (sendSummary) {
        await api(`/groups/${group.id}/summary`, { method: 'POST' })
      }
      await deleteGroup(group.id)
      addEvent({ type: 'group-deleted', groupName: group.name, groupEmoji: group.emoji })
      setLoading(false)
      handleClose()
      onDeleted?.()
      toast.success('Grupo eliminado', {
        description: sendSummary
          ? 'Se envió el resumen y se eliminó el grupo'
          : `"${group.name}" fue eliminado correctamente`,
      })
    } catch {
      setLoading(false)
      toast.error('Error al eliminar el grupo')
    }
  }

  if (step === 'confirm') {
    return (
      <Modal name="deleteGroup" title="Eliminar grupo" onClose={handleClose}>
        <div className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30">
            <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-surface-900 dark:text-white">
              ¿Estás seguro de eliminar "{group.name}"?
            </p>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Se eliminarán todos los gastos y balances asociados. Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => setStep('summary')}>
              Eliminar grupo
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal name="deleteGroup" title="Enviar resumen" onClose={handleClose}>
      <div className="text-center space-y-4">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30">
          <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-surface-900 dark:text-white">
            ¿Deseas enviar el resumen del grupo por mail?
          </p>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Se enviará un resumen con los gastos y balances a todos los miembros antes de eliminar el grupo.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => handleDelete(false)} disabled={loading}>
            {loading ? 'Eliminando...' : 'No, solo eliminar'}
          </Button>
          <Button className="flex-1" onClick={() => handleDelete(true)} disabled={loading}>
            {loading ? 'Procesando...' : 'Sí, enviar y eliminar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
