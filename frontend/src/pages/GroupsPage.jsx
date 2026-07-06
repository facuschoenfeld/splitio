import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GroupCard from '@/components/groups/GroupCard'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUIStore } from '@/stores/useUIStore'

export default function GroupsPage() {
  const groups = useGroupStore((s) => s.groups)
  const openModal = useUIStore((s) => s.openModal)
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  // Acepta tanto el código suelto como un enlace completo /invitacion/<código>.
  function handleJoin(e) {
    e.preventDefault()
    const value = code.trim()
    if (!value) return
    const token = value.includes('/invitacion/') ? value.split('/invitacion/')[1].split(/[?#]/)[0] : value
    navigate(`/invitacion/${token}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-accent-500 dark:text-accent-400 tracking-tight">Grupos</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Administrá tus grupos de gastos compartidos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de invitación"
              className="rounded-xl border border-surface-200 dark:border-primary-700/20 bg-surface-50 dark:bg-surface-950/80 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 focus:outline-none transition-all"
            />
            <Button type="submit" variant="secondary" disabled={!code.trim()}>
              Unirse
            </Button>
          </form>
          <Button onClick={() => openModal('createGroup')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo grupo
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          title="No tenés grupos"
          description="Creá tu primer grupo para empezar a compartir gastos con amigos o compañeros."
          action={
            <Button onClick={() => openModal('createGroup')}>Crear grupo</Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
