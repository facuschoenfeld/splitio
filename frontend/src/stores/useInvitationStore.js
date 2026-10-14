import { create } from 'zustand'
import { api } from '@/api/client'
import { useGroupStore } from '@/stores/useGroupStore'
import { useExpenseStore } from '@/stores/useExpenseStore'

// Acciones de invitaciones (enlace personal por email + código compartible).
// Casi todo son wrappers finos sobre api(); no guardamos estado global.
export const useInvitationStore = create(() => ({
  // Público: datos del grupo + estado del enlace (no requiere sesión).
  previewInvitation(token) {
    return api(`/invitations/${token}`, { auth: false })
  },
  // Requiere sesión: une al usuario y devuelve { groupId }.
  // Refresca grupos, miembros y gastos antes de volver: la carga inicial de App.jsx corre al
  // iniciar sesión, antes de aceptar, y el grupo se vería vacío hasta el próximo sondeo.
  async acceptInvitation(token) {
    const result = await api(`/invitations/${token}/accept`, { method: 'POST' })
    await Promise.all([
      useGroupStore.getState().fetchGroups().catch(() => {}),
      useGroupStore.getState().fetchMembers().catch(() => {}),
      useExpenseStore.getState().fetchExpenses().catch(() => {}),
    ])
    return result
  },
  inviteToGroup(groupId, email) {
    return api(`/groups/${groupId}/invitations`, { method: 'POST', body: { email } })
  },
  fetchInvitations(groupId) {
    return api(`/groups/${groupId}/invitations`)
  },
  revokeInvitation(groupId, invitationId) {
    return api(`/groups/${groupId}/invitations/${invitationId}`, { method: 'DELETE' })
  },
  getInviteCode(groupId) {
    return api(`/groups/${groupId}/invite-code`)
  },
  generateInviteCode(groupId) {
    return api(`/groups/${groupId}/invite-code`, { method: 'POST' })
  },
  revokeInviteCode(groupId) {
    return api(`/groups/${groupId}/invite-code`, { method: 'DELETE' })
  },
}))
