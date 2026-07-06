import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useInvitationStore } from '@/stores/useInvitationStore'
import { useGroupStore } from '@/stores/useGroupStore'
import moneyIcon from '@/assets/money.svg'

const STATUS_MESSAGES = {
  invalid: 'Esta invitación no es válida o fue revocada.',
  expired: 'Esta invitación expiró. Pedile al organizador que te envíe una nueva.',
  accepted: 'Esta invitación ya fue utilizada.',
  full: 'El grupo está lleno (máximo 10 miembros), así que no podés unirte por ahora.',
}

export default function InvitationPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const authLoading = useAuthStore((s) => s.loading)
  const previewInvitation = useInvitationStore((s) => s.previewInvitation)
  const acceptInvitation = useInvitationStore((s) => s.acceptInvitation)

  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    let active = true
    previewInvitation(token)
      .then((data) => active && setPreview(data))
      .catch(() => active && setPreview({ status: 'invalid' }))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [token, previewInvitation])

  async function handleAccept() {
    setAccepting(true)
    try {
      const { groupId } = await acceptInvitation(token)
      // Refrescamos para que el grupo ya esté en el store al redirigir.
      await Promise.all([
        useGroupStore.getState().fetchGroups().catch(() => {}),
        useGroupStore.getState().fetchMembers().catch(() => {}),
      ])
      toast.success('¡Te uniste al grupo!')
      navigate(`/grupos/${groupId}`)
    } catch (err) {
      toast.error(err.message || 'No se pudo aceptar la invitación')
      setAccepting(false)
    }
  }

  const card = (children) => (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={moneyIcon} alt="Splitio" className="w-20 h-20 mx-auto mb-4" />
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card dark:shadow-card-dark border border-surface-200/60 dark:border-primary-700/25 text-center space-y-4">
          {children}
        </div>
      </div>
    </div>
  )

  if (loading || authLoading) {
    return card(<p className="text-surface-500 dark:text-surface-400">Cargando invitación...</p>)
  }

  if (!preview || preview.status === 'invalid' || preview.status === 'expired' || preview.status === 'accepted' || preview.status === 'full') {
    const status = preview?.status || 'invalid'
    return card(
      <>
        <h1 className="text-xl font-bold text-surface-900 dark:text-white">Invitación no disponible</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400">{STATUS_MESSAGES[status]}</p>
        <Link to="/">
          <Button variant="secondary" className="w-full">Ir a Splitio</Button>
        </Link>
      </>
    )
  }

  const { group, inviterName } = preview

  return card(
    <>
      <div className="text-4xl">{group.emoji || '👥'}</div>
      <h1 className="text-xl font-bold text-surface-900 dark:text-white">{group.name}</h1>
      <p className="text-sm text-surface-500 dark:text-surface-400">
        {inviterName ? `${inviterName} te invitó a unirte` : 'Te invitaron a unirte'} a este grupo en Splitio.
      </p>

      {user ? (
        <Button className="w-full" disabled={accepting} onClick={handleAccept}>
          {accepting ? 'Uniéndote...' : 'Unirme al grupo'}
        </Button>
      ) : (
        <div className="space-y-2">
          <Link to={`/register?invite=${token}`}>
            <Button className="w-full">Crear cuenta y unirme</Button>
          </Link>
          <Link to={`/login?invite=${token}`}>
            <Button variant="secondary" className="w-full">Ya tengo cuenta</Button>
          </Link>
        </div>
      )}
    </>
  )
}
