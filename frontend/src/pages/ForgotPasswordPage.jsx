import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/useAuthStore'
import moneyIcon from '@/assets/money.svg'

export default function ForgotPasswordPage() {
  const forgotPassword = useAuthStore((s) => s.forgotPassword)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
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
          <h1 className="text-3xl font-extrabold text-accent-500 dark:text-accent-400 tracking-tight">Recuperar contraseña</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Te enviamos un enlace para restablecerla</p>
        </div>

        {sent ? (
          <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 shadow-card dark:shadow-card-dark border border-surface-200/60 dark:border-primary-700/25 space-y-4">
            <div className="text-sm text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 rounded-xl px-4 py-3">
              Si el email está registrado, vas a recibir un enlace para restablecer tu contraseña. Revisá tu bandeja de entrada (y el spam).
            </div>
            <Link to="/login" className="block">
              <Button type="button" className="w-full">Volver al inicio de sesión</Button>
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
              label="Email"
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-surface-500 dark:text-surface-400 mt-6">
          ¿Te acordaste?{' '}
          <Link to="/login" className="font-semibold text-accent-500 dark:text-accent-400 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
