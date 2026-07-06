import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useUIStore } from '@/stores/useUIStore'
import { useInvitationStore } from '@/stores/useInvitationStore'

const inputClass =
  'flex-1 rounded-xl border border-surface-200 dark:border-primary-700/20 bg-surface-50 dark:bg-surface-950/80 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 focus:outline-none transition-all'

export default function InviteMembersModal() {
  const { activeModal, modalData, closeModal } = useUIStore()
  const isOpen = activeModal === 'inviteMembers'
  const groupId = modalData?.groupId
  const isAdmin = modalData?.isAdmin

  const inviteToGroup = useInvitationStore((s) => s.inviteToGroup)
  const fetchInvitations = useInvitationStore((s) => s.fetchInvitations)
  const revokeInvitation = useInvitationStore((s) => s.revokeInvitation)
  const getInviteCode = useInvitationStore((s) => s.getInviteCode)
  const generateInviteCode = useInvitationStore((s) => s.generateInviteCode)
  const revokeInviteCode = useInvitationStore((s) => s.revokeInviteCode)

  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [invitations, setInvitations] = useState([])
  const [code, setCode] = useState(null)
  const [codeBusy, setCodeBusy] = useState(false)

  useEffect(() => {
    if (!isOpen || !groupId) return
    fetchInvitations(groupId).then(setInvitations).catch(() => {})
    getInviteCode(groupId).then((d) => setCode(d.token)).catch(() => {})
  }, [isOpen, groupId, fetchInvitations, getInviteCode])

  const codeLink = code ? `${window.location.origin}/invitacion/${code}` : null

  async function handleInvite(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return
    setInviting(true)
    try {
      await inviteToGroup(groupId, trimmed)
      setEmail('')
      setInvitations(await fetchInvitations(groupId))
      toast.success('Invitación enviada')
    } catch (err) {
      toast.error(err.message || 'No se pudo enviar la invitación')
    } finally {
      setInviting(false)
    }
  }

  async function handleRevokeInvite(id) {
    try {
      await revokeInvitation(groupId, id)
      setInvitations((prev) => prev.filter((i) => i.id !== id))
    } catch {
      toast.error('No se pudo revocar la invitación')
    }
  }

  async function handleGenerateCode() {
    setCodeBusy(true)
    try {
      const { token } = await generateInviteCode(groupId)
      setCode(token)
      toast.success('Código generado')
    } catch (err) {
      toast.error(err.message || 'No se pudo generar el código')
    } finally {
      setCodeBusy(false)
    }
  }

  async function handleRevokeCode() {
    setCodeBusy(true)
    try {
      await revokeInviteCode(groupId)
      setCode(null)
      toast.success('Código revocado')
    } catch (err) {
      toast.error(err.message || 'No se pudo revocar el código')
    } finally {
      setCodeBusy(false)
    }
  }

  function copy(text) {
    navigator.clipboard?.writeText(text).then(
      () => toast.success('Copiado'),
      () => toast.error('No se pudo copiar')
    )
  }

  return (
    <Modal name="inviteMembers" title="Invitar al grupo" onClose={closeModal}>
      <div className="space-y-6">
        {/* Invitar por email */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Invitar por email</h3>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className={inputClass}
            />
            <Button type="submit" size="sm" disabled={inviting}>
              {inviting ? 'Enviando...' : 'Invitar'}
            </Button>
          </form>

          {invitations.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-50 dark:bg-surface-800/60"
                >
                  <span className="text-sm text-surface-700 dark:text-surface-300 truncate">{inv.email}</span>
                  <button
                    onClick={() => handleRevokeInvite(inv.id)}
                    className="shrink-0 text-xs text-danger-500 hover:underline cursor-pointer"
                  >
                    Revocar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Código / enlace compartible */}
        <div className="space-y-2 border-t border-surface-100 dark:border-primary-700/15 pt-4">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Enlace compartible</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Cualquiera con este enlace o código puede unirse al grupo (hasta completar los 10 miembros).
          </p>

          {code ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input readOnly value={codeLink} className={inputClass} onFocus={(e) => e.target.select()} />
                <Button type="button" variant="secondary" size="sm" onClick={() => copy(codeLink)}>
                  Copiar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500 dark:text-surface-400">Código:</span>
                <code className="text-sm font-mono text-primary-600 dark:text-primary-300">{code}</code>
                <button onClick={() => copy(code)} className="text-xs text-primary-500 hover:underline cursor-pointer">
                  copiar
                </button>
              </div>
              {isAdmin && (
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" disabled={codeBusy} onClick={handleGenerateCode}>
                    Regenerar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={codeBusy} onClick={handleRevokeCode}>
                    Revocar
                  </Button>
                </div>
              )}
            </div>
          ) : isAdmin ? (
            <Button type="button" size="sm" disabled={codeBusy} onClick={handleGenerateCode}>
              {codeBusy ? 'Generando...' : 'Generar enlace'}
            </Button>
          ) : (
            <p className="text-sm text-surface-400 dark:text-surface-500">
              No hay un enlace compartible activo. Pedile a un administrador que lo genere.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
