import { useState } from 'react'
import { toast } from 'sonner'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { formatCurrency } from '@/utils/formatCurrency'
import { useUIStore } from '@/stores/useUIStore'

function CopyAliasButton({ alias, name }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(alias)
      setCopied(true)
      toast.success('Copiado', { description: `CBU/Alias de ${name} copiado al portapapeles` })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar')
    }
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copiar CBU/Alias de ${name}: ${alias}`}
      className="p-2 rounded-lg text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
    >
      {copied ? (
        <svg className="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H6M15.75 18.75h-9A2.25 2.25 0 014.5 16.5V6.108c0-1.135.845-2.098 1.976-2.192a48.424 48.424 0 011.123-.08M15.75 18.75a2.25 2.25 0 002.25-2.25M9.348 4.148a48.627 48.627 0 016.054-.096" />
        </svg>
      )}
    </button>
  )
}

export default function BalanceCard({ debt, groupId }) {
  const openModal = useUIStore((s) => s.openModal)

  return (
    <div className="flex items-center gap-3 p-4">
      <Avatar name={debt.from.name} src={debt.from.avatar} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-surface-700 dark:text-surface-300">
          <span className="font-semibold text-surface-900 dark:text-white">{debt.from.name}</span>
          {' '}le debe a{' '}
          <span className="font-semibold text-surface-900 dark:text-white">{debt.to.name}</span>
        </p>
        <p className="text-lg font-bold text-danger-600 mt-0.5">{formatCurrency(debt.amount)}</p>
      </div>
      <div className="flex items-center gap-1">
        {debt.to.payment_alias && (
          <CopyAliasButton alias={debt.to.payment_alias} name={debt.to.name} />
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => openModal('settleDebt', { ...debt, groupId })}
        >
          Saldar
        </Button>
      </div>
    </div>
  )
}
