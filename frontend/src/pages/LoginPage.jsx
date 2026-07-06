import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useInvitationStore } from '@/stores/useInvitationStore'
import { useGroupStore } from '@/stores/useGroupStore'
import moneyIcon from '@/assets/money.svg'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)
  const acceptInvitation = useInvitationStore((s) => s.acceptInvitation)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const invite = searchParams.get('invite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      if (invite) {
        try {
          const { groupId } = await acceptInvitation(invite)
          await useGroupStore.getState().fetchGroups().catch(() => {})
          navigate(`/grupos/${groupId}`)
          return
        } catch {
          // Si la invitación falla (expirada/llena), igual logueamos y vamos al inicio.
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
          <h1 className="text-3xl font-extrabold text-accent-500 dark:text-accent-400 tracking-tight">Splitio</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Iniciá sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card dark:shadow-card-dark border border-surface-200/60 dark:border-primary-700/25 space-y-4">
          {error && (
            <div className="text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
          <Input
            label="Email"
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
          <Input
            label="Contraseña"
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Iniciar sesión'}
          </Button>
          <p className="text-center text-sm">
            <Link to="/forgot-password" className="text-surface-500 dark:text-surface-400 hover:text-accent-500 dark:hover:text-accent-400 hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
        </form>

        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          ¿No tenés cuenta?{' '}
          <Link to={invite ? `/register?invite=${invite}` : '/register'} className="font-semibold text-accent-500 dark:text-accent-400 hover:underline">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
