import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/useAuthStore'
import moneyIcon from '@/assets/money.svg'

export default function ResetPasswordPage() {
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setSubmitting(true)
    try {
      await resetPassword(token, password)
      toast.success('Contraseña actualizada, ya podés iniciar sesión')
      navigate('/login')
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
          <h1 className="text-3xl font-extrabold text-accent-500 dark:text-accent-400 tracking-tight">Nueva contraseña</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Elegí una contraseña para tu cuenta</p>
        </div>

        {!token ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card dark:shadow-card-dark border border-surface-200/60 dark:border-primary-700/25 space-y-4">
            <div className="text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 rounded-xl px-4 py-2.5">
              El enlace no es válido o está incompleto. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".
            </div>
            <Link to="/forgot-password" className="block">
              <Button type="button" className="w-full">Pedir nuevo enlace</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card dark:shadow-card-dark border border-surface-200/60 dark:border-primary-700/25 space-y-4">
            {error && (
              <div className="text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
            <Input
              label="Nueva contraseña"
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
            <Input
              label="Confirmar contraseña"
              id="reset-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              minLength={6}
              required
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          <Link to="/login" className="font-semibold text-accent-500 dark:text-accent-400 hover:underline">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
