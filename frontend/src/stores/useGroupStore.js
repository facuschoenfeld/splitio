import { create } from 'zustand'
import { api } from '@/api/client'

export const useGroupStore = create((set) => ({
  groups: [],
  members: [],

  async fetchGroups() {
    const groups = await api('/groups')
    set({ groups })
  },

  async fetchMembers() {
    const members = await api('/users')
    set({ members })
  },

  async addGroup(group) {
    const created = await api('/groups', {
      method: 'POST',
      body: {
        name: group.name,
        description: group.description,
        emoji: group.emoji,
        memberIds: group.members,
        newMembers: group.newMembers || [],
        inviteEmails: group.inviteEmails || [],
      },
    })
    set((state) => ({ groups: [...state.groups, created] }))
    if (group.newMembers?.length || group.inviteEmails?.length) {
      const members = await api('/users')
      set({ members })
    }
  },

  async updateGroup(id, data) {
    const updated = await api(`/groups/${id}`, { method: 'PUT', body: data })
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...updated } : g)),
    }))
  },

  async deleteGroup(id) {
    await api(`/groups/${id}`, { method: 'DELETE' })
    set((state) => ({ groups: state.groups.filter((g) => g.id !== id) }))
  },

  async updateGroupMember(groupId, userId, data) {
    const override = await api(`/groups/${groupId}/members/${userId}`, { method: 'PUT', body: data })
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              memberOverrides: {
                ...(g.memberOverrides || {}),
                [userId]: {
                  nickname: override.nickname,
                  payment_alias: override.payment_alias,
                  cbu: override.cbu,
                },
              },
            }
          : g
      ),
    }))
  },
}))
