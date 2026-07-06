import { useState } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import { useUIStore } from '@/stores/useUIStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { displayEmail } from '@/utils/displayEmail'

export default function EditMemberModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const updateGroupMember = useGroupStore((s) => s.updateGroupMember)

  const [selectedMember, setSelectedMember] = useState(null)
  const [nickname, setNickname] = useState('')
  const [paymentAlias, setPaymentAlias] = useState('')
  const [cbu, setCbu] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (activeModal !== 'editMember' || !modalData) return null

  const groupId = modalData.groupId
  const members = modalData.groupMembers || []

  // Resetea el formulario al cerrar (Escape, overlay, X o botones) para que al
  // reabrir el modal arranque siempre en la selección de miembro y sin datos previos.
  function handleClose() {
    closeModal()
    setSelectedMember(null)
    setNickname('')
    setPaymentAlias('')
    setCbu('')
  }

  function handleSelectMember(member) {
    setSelectedMember(member)
    setNickname(member.nickname || '')
    setPaymentAlias(member.payment_alias || '')
    setCbu(member.cbu || '')
  }

  function handleBack() {
    setSelectedMember(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateGroupMember(groupId, selectedMember.id, {
        nickname: nickname.trim() || null,
        payment_alias: paymentAlias.trim() || null,
        cbu: cbu.trim() || null,
      })
      const displayName = nickname.trim() || selectedMember.realName || selectedMember.name
      handleClose()
      toast.success('Miembro actualizado', { description: `"${displayName}" se actualizó correctamente` })
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el miembro')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedMember) {
    return (
      <Modal name="editMember" title="Editar miembro" onClose={handleClose}>
        <p className="text-sm text-surface-500 dark:text-surface-400 mb-3">Seleccioná el miembro que querés editar</p>
        <ul className="divide-y divide-surface-100 dark:divide-primary-700/15 -mx-6 sm:-mx-8">
          {members.map((member) => (
            <li key={member.id}>
              <button
                onClick={() => handleSelectMember(member)}
                className="w-full flex items-center gap-3 px-6 sm:px-8 py-3 hover:bg-surface-50 dark:hover:bg-primary-600/10 transition-colors cursor-pointer text-left"
              >
                <Avatar name={member.name} src={member.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{member.name}</span>
                  {displayEmail(member.email) && (
                    <p className="text-xs text-surface-400 dark:text-surface-500 truncate">{displayEmail(member.email)}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    )
  }

  return (
    <Modal name="editMember" title="Editar miembro" onClose={handleClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 pb-2">
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 -ml-1.5 rounded-lg text-surface-400 dark:text-surface-500 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <Avatar name={selectedMember.realName || selectedMember.name} src={selectedMember.avatar} size="lg" />
          <div>
            <p className="text-sm font-semibold text-surface-900 dark:text-white">{selectedMember.realName || selectedMember.name}</p>
            {displayEmail(selectedMember.email) && (
              <p className="text-xs text-surface-400">{displayEmail(selectedMember.email)}</p>
            )}
          </div>
        </div>
        <Input
          label="Apodo en el grupo"
          id="edit-member-nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={selectedMember.realName || selectedMember.name}
        />
        <Input
          label="Alias de pago"
          id="edit-member-alias"
          value={paymentAlias}
          onChange={(e) => setPaymentAlias(e.target.value)}
          placeholder="Ej: alias.mp"
        />
        <Input
          label="CBU"
          id="edit-member-cbu"
          value={cbu}
          onChange={(e) => setCbu(e.target.value)}
          placeholder="Ej: 0000003100012345678901"
        />
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
