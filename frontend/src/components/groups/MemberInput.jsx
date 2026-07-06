import { useState } from 'react'
import Button from '@/components/ui/Button'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function MemberInput({ onAdd, existingEmails, disabled }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [paymentAlias, setPaymentAlias] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    setError('')
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (email && !EMAIL_RE.test(email)) {
      setError('Email inválido')
      return
    }
    if (email && existingEmails.includes(email.toLowerCase())) {
      setError('Este email ya fue agregado')
      return
    }
    onAdd({ name: name.trim(), email: email.trim() || null, payment_alias: paymentAlias.trim() || null })
    setName('')
    setEmail('')
    setPaymentAlias('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const inputClass = 'flex-1 rounded-xl border border-surface-200 dark:border-primary-700/20 bg-surface-50 dark:bg-surface-950/80 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 focus:outline-none transition-all'

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nombre"
          disabled={disabled}
          className={inputClass}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Email (opcional)"
          disabled={disabled}
          className={inputClass}
        />
        <Button type="button" variant="ghost" size="sm" onClick={handleAdd} disabled={disabled}>
          +
        </Button>
      </div>
      <input
        type="text"
        value={paymentAlias}
        onChange={(e) => setPaymentAlias(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="CBU / Alias (opcional)"
        disabled={disabled}
        className={'w-full ' + inputClass}
      />
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
}
