import { useState } from 'react'
import Button from '@/components/ui/Button'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function InviteByEmail({ onInvite, onAutoSelect, existingEmails, storeMembers, disabled }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleInvite = () => {
    setError('')
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    if (!EMAIL_RE.test(trimmed)) {
      setError('Email inválido')
      return
    }
    if (existingEmails.includes(trimmed)) {
      setError('Este email ya fue agregado')
      return
    }
    const existingMember = storeMembers.find((m) => m.email?.toLowerCase() === trimmed)
    if (existingMember) {
      onAutoSelect(existingMember.id)
      setEmail('')
      return
    }
    onInvite(trimmed)
    setEmail('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleInvite()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="email@ejemplo.com"
          disabled={disabled}
          className="flex-1 rounded-xl border border-surface-200 dark:border-primary-700/20 bg-surface-50 dark:bg-surface-950/80 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:border-primary-500 focus:ring-3 focus:ring-primary-500/15 focus:outline-none transition-all"
        />
        <Button type="button" variant="ghost" size="sm" onClick={handleInvite} disabled={disabled}>
          Invitar
        </Button>
      </div>
      {error && <p className="text-xs text-danger-500">{error}</p>}
    </div>
  )
}
