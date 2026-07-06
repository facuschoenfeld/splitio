import { useRef, useState } from 'react'
import { toast } from 'sonner'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import Avatar from '@/components/ui/Avatar'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/stores/useAuthStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { formatCurrency } from '@/utils/formatCurrency'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const fetchMembers = useGroupStore((s) => s.fetchMembers)
  const groups = useGroupStore((s) => s.groups)
  const expenses = useExpenseStore((s) => s.expenses)
  // Los settlements (pagos para saldar deudas) no son gastos reales; el resto de
  // la app los excluye antes de sumar, así que acá hacemos lo mismo.
  const realExpenses = expenses.filter((e) => e.category !== 'settlement')
  const totalExpenses = realExpenses.reduce((sum, e) => sum + e.amount, 0)
  const myExpenses = realExpenses.filter((e) => e.paidBy === user?.id)
  const myTotal = myExpenses.reduce((sum, e) => sum + e.amount, 0)
  const [paymentAlias, setPaymentAlias] = useState(user?.payment_alias || '')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar)
  const removeAvatar = useAuthStore((s) => s.removeAvatar)
  const fileInputRef = useRef(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [savingNotif, setSavingNotif] = useState(null)

  async function handleSaveProfile() {
    setSavingProfile(true)
    try {
      await updateProfile({ name: name.trim() })
      await fetchMembers()
      toast.success('Perfil actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-subir el mismo archivo
    if (!file) return
    setAvatarBusy(true)
    try {
      await uploadAvatar(file)
      await fetchMembers()
      toast.success('Foto actualizada')
    } catch (err) {
      toast.error(err.message || 'Error al subir la foto')
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true)
    try {
      await removeAvatar()
      await fetchMembers()
      toast.success('Foto eliminada')
    } catch {
      toast.error('Error al eliminar la foto')
    } finally {
      setAvatarBusy(false)
    }
  }

  async function handleToggleNotif(field) {
    setSavingNotif(field)
    try {
      await updateProfile({ [field]: !user?.[field] })
      toast.success('Preferencias actualizadas')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSavingNotif(null)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-accent-500 dark:text-accent-400">Perfil</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Configuración de tu cuenta</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">Información personal</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-surface-100">
            <Avatar name={user?.name} src={user?.avatar} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-surface-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-surface-500 dark:text-surface-400">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={avatarBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarBusy ? 'Procesando...' : 'Cambiar foto'}
                </Button>
                {user?.avatar && (
                  <Button variant="ghost" size="sm" disabled={avatarBusy} onClick={handleRemoveAvatar}>
                    Quitar foto
                  </Button>
                )}
              </div>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">PNG, JPG o WEBP. Máx. 2 MB.</p>
            </div>
          </div>
          <Input
            label="Nombre"
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email"
            id="profile-email"
            type="email"
            value={user?.email || ''}
            disabled
            readOnly
          />
          <Button
            disabled={savingProfile || !name.trim() || name.trim() === (user?.name || '')}
            onClick={handleSaveProfile}
          >
            {savingProfile ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">Datos de pago</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Agregá tu CBU o alias para que otros miembros puedan transferirte al saldar deudas.
          </p>
          <Input
            label="CBU / Alias"
            id="payment-alias"
            value={paymentAlias}
            onChange={(e) => setPaymentAlias(e.target.value)}
            placeholder="Ej: mi.alias.mp o 0000003100012345678901"
          />
          <Button
            disabled={saving || paymentAlias === (user?.payment_alias || '')}
            onClick={async () => {
              setSaving(true)
              try {
                await updateProfile({ payment_alias: paymentAlias.trim() || null })
                await fetchMembers()
                toast.success('Datos de pago actualizados')
              } catch {
                toast.error('Error al guardar')
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Guardando...' : 'Guardar CBU / Alias'}
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">Notificaciones</h3>
        </CardHeader>
        <CardBody className="space-y-1">
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
            Elegí qué emails querés recibir.
          </p>
          <NotificationToggle
            label="Invitaciones a grupos"
            description="Cuando alguien te invita a un grupo nuevo."
            checked={user?.notify_group_invites ?? true}
            disabled={savingNotif === 'notify_group_invites'}
            onChange={() => handleToggleNotif('notify_group_invites')}
          />
          <NotificationToggle
            label="Resúmenes de grupo"
            description="El resumen de gastos en PDF cuando lo solicitás."
            checked={user?.notify_group_summaries ?? true}
            disabled={savingNotif === 'notify_group_summaries'}
            onChange={() => handleToggleNotif('notify_group_summaries')}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">Estadísticas</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Grupos activos</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white">{groups.length}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Total gastos</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white">{realExpenses.length}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Pagado por vos</p>
              <p className="text-xl font-bold text-accent-500 dark:text-accent-400">{formatCurrency(myTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500 dark:text-surface-400">Total general</p>
              <p className="text-xl font-bold text-surface-900 dark:text-white">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function NotificationToggle({ label, description, checked, disabled, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-surface-900 dark:text-white">{label}</p>
        <p className="text-xs text-surface-500 dark:text-surface-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
          checked ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
