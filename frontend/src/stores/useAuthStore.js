import { create } from 'zustand'
import { api, setTokens, clearTokens, getAccessToken } from '@/api/client'

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  async init() {
    const token = getAccessToken()
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const user = await api('/users/me')
      set({ user, loading: false })
    } catch {
      clearTokens()
      set({ user: null, loading: false })
    }
  },

  async login(email, password) {
    const data = await api('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
    setTokens(data.access, data.refresh)
    set({ user: data.user })
  },

  async register(name, email, password) {
    const data = await api('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      auth: false,
    })
    setTokens(data.access, data.refresh)
    set({ user: data.user })
  },

  async forgotPassword(email) {
    return api('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      auth: false,
    })
  },

  async resetPassword(token, password) {
    return api('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
      auth: false,
    })
  },

  async updateProfile(data) {
    const user = await api('/users/me', { method: 'PUT', body: data })
    set({ user })
  },

  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    const user = await api('/users/me/avatar', { method: 'POST', body: formData })
    set({ user })
  },

  async removeAvatar() {
    const user = await api('/users/me/avatar', { method: 'DELETE' })
    set({ user })
  },

  logout() {
    clearTokens()
    set({ user: null })
  },
}))
