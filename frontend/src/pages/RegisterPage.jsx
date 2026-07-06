import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useInvitationStore } from '@/stores/useInvitationStore'
import { useGroupStore } from '@/stores/useGroupStore'
import moneyIcon from '@/assets/money.svg'

export default function RegisterPage() {
  const register = useAuthStore((s) => s.register)
  const previewInvitation = useInvitationStore((s) => s.previewInvitation)
  const acceptInvitation = useInvitationStore((s) => s.acceptInvitation)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invite = searchParams.get('invite')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Si venís de una invitación personal, prefijamos el email destinatario.
  useEffect(() => {
    if (!invite) return
    let active = true
    previewInvitation(invite)
      .then((data) => {
        if (active && data?.email) setEmail(data.email)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [invite, previewInvitation])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await register(name, email, password)
      if (invite) {
        try {
          const { groupId } = await acceptInvitation(invite)
          await useGroupStore.getState().fetchGroups().catch(() => {})
          navigate(`/grupos/${groupId}`)
          return
        } catch {
          // Si la invitación falla (expirada/llena), igual quedás registrado.
        }
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src={moneyIcon} alt="Splitio" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-accent-500 dark:text-accent-400 tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Registrate para empezar a dividir gastos</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card dark:shadow-card-dark border border-surface-200/60 dark:border-primary-700/25 space-y-4">
          {error && (
            <div className="text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
          <Input
            label="Nombre"
            id="register-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            required
          />
          <Input
            label="Email"
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
          <Input
            label="Contraseña"
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            minLength={6}
            required
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Creando cuenta...' : 'Registrarse'}
          </Button>
        </form>

        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          ¿Ya tenés tu cuenta?{' '}
          <Link to={invite ? `/login?invite=${invite}` : '/login'} className="font-semibold text-accent-500 dark:text-accent-400 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
