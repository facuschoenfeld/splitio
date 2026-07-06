import { useState } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import MemberInput from '@/components/groups/MemberInput'
import InviteByEmail from '@/components/groups/InviteByEmail'
import PendingMembersList from '@/components/groups/PendingMembersList'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'

const EMOJIS = ['🏠', '✈️', '🔥', '🍕', '🎮', '🏋️', '🎓', '🎉', '🛒', '💼']
const MAX_NEW = 10

export default function CreateGroupModal() {
  const addGroup = useGroupStore((s) => s.addGroup)
  const members = useGroupStore((s) => s.members)
  const closeModal = useUIStore((s) => s.closeModal)
  const user = useAuthStore((s) => s.user)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🏠')
  const [selectedMembers, setSelectedMembers] = useState([user?.id])
  const [newMembers, setNewMembers] = useState([])
  const [inviteEmails, setInviteEmails] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const newCount = newMembers.length + inviteEmails.length
  const totalMembers = selectedMembers.length + newCount
  const canAddMore = newCount < MAX_NEW

  const allEmails = [
    ...newMembers.filter((m) => m.email).map((m) => m.email.toLowerCase()),
    ...inviteEmails.map((e) => e.toLowerCase()),
  ]

  const toggleMember = (id) => {
    if (id === user?.id) return
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const handleAddNewMember = (member) => {
    setNewMembers((prev) => [...prev, { ...member, tempId: crypto.randomUUID() }])
  }

  const handleRemoveNewMember = (tempId) => {
    setNewMembers((prev) => prev.filter((m) => m.tempId !== tempId))
  }

  const handleInviteEmail = (email) => {
    setInviteEmails((prev) => [...prev, email])
  }

  const handleRemoveEmail = (email) => {
    setInviteEmails((prev) => prev.filter((e) => e !== email))
  }

  const handleAutoSelect = (memberId) => {
    if (!selectedMembers.includes(memberId)) {
      setSelectedMembers((prev) => [...prev, memberId])
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setEmoji('🏠')
    setSelectedMembers([user?.id])
    setNewMembers([])
    setInviteEmails([])
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || totalMembers < 2) return
    setIsSubmitting(true)
    setError(null)
    try {
      await addGroup({
        name: name.trim(),
        description: description.trim(),
        emoji,
        members: selectedMembers,
        newMembers: newMembers.map(({ name, email, payment_alias }) => ({ name, email, payment_alias })),
        inviteEmails,
      })
      closeModal()
      resetForm()
      toast.success('Grupo creado', { description: `"${name.trim()}" se creó correctamente` })
    } catch (err) {
      toast.error(err.message || 'Error al crear el grupo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal name="createGroup" title="Crear grupo">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Ícono</label>
          <div className="flex gap-2 flex-wrap">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  emoji === e ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-primary-600/10'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        <Input label="Nombre del grupo" id="group-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Departamento" required />
        <Input label="Descripción" id="group-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Gastos compartidos del depto" />
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Miembros existentes</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedMembers.includes(member.id) ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-surface-50 dark:hover:bg-primary-600/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  disabled={member.id === user?.id}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">
                  {member.name} {member.id === user?.id && '(tú)'}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            Agregar nuevo miembro
            <span className="text-surface-400 font-normal ml-2">({newCount}/{MAX_NEW})</span>
          </label>
          <MemberInput onAdd={handleAddNewMember} existingEmails={allEmails} disabled={!canAddMore} />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Invitar por email</label>
          <InviteByEmail
            onInvite={handleInviteEmail}
            onAutoSelect={handleAutoSelect}
            existingEmails={allEmails}
            storeMembers={members}
            disabled={!canAddMore}
          />
        </div>
        {(newMembers.length > 0 || inviteEmails.length > 0) && (
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Pendientes de agregar</label>
            <PendingMembersList
              newMembers={newMembers}
              inviteEmails={inviteEmails}
              onRemoveMember={handleRemoveNewMember}
              onRemoveEmail={handleRemoveEmail}
            />
          </div>
        )}
        {error && (
          <p className="text-sm text-danger-500 bg-danger-50 dark:bg-danger-900/20 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={closeModal} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={!name.trim() || totalMembers < 2 || isSubmitting}>
            {isSubmitting ? 'Creando...' : 'Crear grupo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
