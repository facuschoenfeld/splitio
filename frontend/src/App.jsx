import { useEffect } from 'react'
import { Toaster } from 'sonner'
import AppRouter from '@/router/AppRouter'
import CreateGroupModal from '@/components/groups/CreateGroupModal'
import EditGroupModal from '@/components/groups/EditGroupModal'
import EditMemberModal from '@/components/groups/EditMemberModal'
import AddExpenseModal from '@/components/expenses/AddExpenseModal'
import SettleDebtModal from '@/components/balances/SettleDebtModal'
import DeleteGroupModal from '@/components/groups/DeleteGroupModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { useExpenseStore } from '@/stores/useExpenseStore'
import { useThemeStore } from '@/stores/useThemeStore'

export default function App() {
  const user = useAuthStore((s) => s.user)
  const init = useAuthStore((s) => s.init)
  const fetchGroups = useGroupStore((s) => s.fetchGroups)
  const fetchMembers = useGroupStore((s) => s.fetchMembers)
  const fetchExpenses = useExpenseStore((s) => s.fetchExpenses)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    init()
  }, [init])

  useEffect(() => {
    if (!user) return

    fetchGroups().catch(() => {})
    fetchMembers().catch(() => {})
    fetchExpenses().catch(() => {})

    const interval = setInterval(() => {
      fetchGroups().catch(() => {})
      fetchMembers().catch(() => {})
      fetchExpenses().catch(() => {})
    }, 30000)

    return () => clearInterval(interval)
  }, [user, fetchGroups, fetchMembers, fetchExpenses])

  return (
    <>
      <AppRouter />
      {user && (
        <>
          <CreateGroupModal />
          <EditGroupModal />
          <EditMemberModal />
          <AddExpenseModal />
          <SettleDebtModal />
          <DeleteGroupModal />
        </>
      )}
      <Toaster
        position="bottom-right"
        theme={theme}
        richColors
        toastOptions={{
          className: 'font-sans',
        }}
      />
    </>
  )
}
