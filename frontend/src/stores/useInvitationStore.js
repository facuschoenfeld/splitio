import { create } from 'zustand'
import { api } from '@/api/client'

// Acciones de invitaciones (enlace personal por email + código compartible).
// Casi todo son wrappers finos sobre api(); no guardamos estado global.
export const useInvitationStore = create(() => ({
  // Público: datos del grupo + estado del enlace (no requiere sesión).
  previewInvitation(token) {
    return api(`/invitations/${token}`, { auth: false })
  },
  // Requiere sesión: une al usuario y devuelve { groupId }.
  acceptInvitation(token) {
    return api(`/invitations/${token}/accept`, { method: 'POST' })
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
