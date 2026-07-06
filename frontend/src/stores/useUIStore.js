import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarOpen: false,
  activeModal: null,
  modalData: null,

  toggleSidebar() {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }))
  },

  closeSidebar() {
    set({ sidebarOpen: false })
  },

  openModal(modalName, data = null) {
    set({ activeModal: modalName, modalData: data })
  },

  closeModal() {
    set({ activeModal: null, modalData: null })
  },
}))
