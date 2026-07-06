import { create } from 'zustand'
import { api } from '@/api/client'

export const useExpenseStore = create((set) => ({
  expenses: [],

  async fetchExpenses() {
    const expenses = await api('/expenses')
    set({ expenses })
  },

  async addExpense(expense) {
    const created = await api('/expenses', {
      method: 'POST',
      body: expense,
    })
    set((state) => ({ expenses: [...state.expenses, created] }))
  },

  async deleteExpense(id) {
    await api(`/expenses/${id}`, { method: 'DELETE' })
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }))
  },

  async settleDebt({ groupId, fromUserId, toUserId, amount }) {
    const created = await api('/expenses/settle', {
      method: 'POST',
      body: { groupId, fromUserId, toUserId, amount },
    })
    set((state) => ({ expenses: [...state.expenses, created] }))
  },
}))
