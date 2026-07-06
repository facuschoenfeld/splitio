import { useState } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useUIStore } from '@/stores/useUIStore'
import { useGroupStore } from '@/stores/useGroupStore'

const EMOJIS = ['🏠', '✈️', '🔥', '🍕', '🎮', '🏋️', '🎓', '🎉', '🛒', '💼']

export default function EditGroupModal() {
  const { activeModal, modalData } = useUIStore()

  if (activeModal !== 'editGroup' || !modalData) return null

  // key remonta el form por grupo: los initializers de useState toman los datos
  // del grupo sin necesitar un efecto que sincronice estado con props.
  return <EditGroupForm key={modalData.id} group={modalData} />
}

function EditGroupForm({ group }) {
  const closeModal = useUIStore((s) => s.closeModal)
  const updateGroup = useGroupStore((s) => s.updateGroup)

  const [name, setName] = useState(group.name || '')
  const [description, setDescription] = useState(group.description || '')
  const [emoji, setEmoji] = useState(group.emoji || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await updateGroup(group.id, {
        name: name.trim(),
        description: description.trim(),
        emoji: emoji || '👥',
      })
      closeModal()
      toast.success('Grupo actualizado', { description: `"${name.trim()}" se actualizó correctamente` })
    } catch (err) {
      toast.error(err.message || 'Error al actualizar el grupo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal name="editGroup" title="Editar grupo">
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
        <Input
          label="Nombre del grupo"
          id="edit-group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Viaje a la playa"
          required
        />
        <Input
          label="Descripción"
          id="edit-group-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ej: Gastos del viaje"
        />
        {error && (
          <p className="text-sm text-danger-500 bg-danger-50 dark:bg-danger-900/20 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={closeModal} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={!name.trim() || isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
