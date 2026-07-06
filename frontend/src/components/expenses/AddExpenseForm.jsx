import { useState } from 'react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { CATEGORIES } from '@/data/mockData'

export default function AddExpenseForm() {
  const addExpense = useExpenseStore((s) => s.addExpense)
  const groups = useGroupStore((s) => s.groups)
  const allMembers = useGroupStore((s) => s.members)
  const { closeModal, modalData } = useUIStore()
  const user = useAuthStore((s) => s.user)

  const initialGroupId = modalData?.groupId || ''
  const initialGroup = groups.find((g) => g.id === initialGroupId)
  const initialMembers = initialGroup
    ? allMembers.filter((m) => initialGroup.members.includes(m.id))
    : []
  const initialSplit = initialMembers.map((m) => m.id)

  // El usuario actual puede no ser miembro del grupo; en ese caso el pagador por
  // defecto es el primer miembro (que es lo que muestra el dropdown), no un id inválido.
  const pickPayer = (groupMembers) =>
    groupMembers.some((m) => m.id === user?.id) ? user?.id : groupMembers[0]?.id || ''

  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [groupId, setGroupId] = useState(initialGroupId)
  const [paidBy, setPaidBy] = useState(() => pickPayer(initialMembers))
  const [category, setCategory] = useState('otros')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [splitBetween, setSplitBetween] = useState(initialSplit)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const group = groups.find((g) => g.id === groupId)
  const members = group ? allMembers.filter((m) => group.members.includes(m.id)) : []

  const handleGroupChange = (newGroupId) => {
    setGroupId(newGroupId)
    const newGroup = groups.find((g) => g.id === newGroupId)
    const groupMembers = newGroup ? allMembers.filter((m) => newGroup.members.includes(m.id)) : []
    setSplitBetween(groupMembers.map((m) => m.id))
    setPaidBy(pickPayer(groupMembers))
  }

  const toggleSplit = (id) => {
    setSplitBetween((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim() || !amount || !groupId || splitBetween.length === 0) return
    setIsSubmitting(true)
    setError(null)
    try {
      await addExpense({
        description: description.trim(),
        amount: parseFloat(amount),
        groupId,
        paidBy,
        splitBetween,
        category,
        date,
      })
      closeModal()
      toast.success('Gasto agregado', { description: `"${description.trim()}" por $${parseFloat(amount).toFixed(2)}` })
    } catch (err) {
      toast.error(err.message || 'Error al agregar el gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Descripción"
        id="expense-desc"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ej: Cena en restaurante"
        required
      />
      <Input
        label="Monto"
        id="expense-amount"
        type="number"
        min="0"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />
      {!initialGroupId && (
        <Select
          label="Grupo"
          id="expense-group"
          value={groupId}
          onChange={(e) => handleGroupChange(e.target.value)}
          required
        >
          <option value="">Seleccionar grupo</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
          ))}
        </Select>
      )}
      {members.length > 0 && (
        <Select
          label="Pagado por"
          id="expense-paidby"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}{m.id === user?.id ? ' (tú)' : ''}</option>
          ))}
        </Select>
      )}
      <Select
        label="Categoría"
        id="expense-category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <option key={key} value={key}>{cat.label}</option>
        ))}
      </Select>
      <Input
        label="Fecha"
        id="expense-date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {members.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Dividir entre</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  splitBetween.includes(member.id) ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-surface-50 dark:hover:bg-primary-600/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={splitBetween.includes(member.id)}
                  onChange={() => toggleSplit(member.id)}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-surface-700 dark:text-surface-300">{member.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {error && (
        <p className="text-sm text-danger-500 bg-danger-50 dark:bg-danger-900/20 rounded-lg px-3 py-2">{error}</p>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={closeModal} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={!description.trim() || !amount || !groupId || splitBetween.length === 0 || isSubmitting}>
          {isSubmitting ? 'Agregando...' : 'Agregar gasto'}
        </Button>
      </div>
    </form>
  )
}
