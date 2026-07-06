import { create } from 'zustand'

export const useActivityStore = create((set) => ({
  events: [],

  addEvent(event) {
    set((state) => ({
      events: [{ ...event, id: crypto.randomUUID(), date: new Date().toISOString() }, ...state.events],
    }))
  },
}))
