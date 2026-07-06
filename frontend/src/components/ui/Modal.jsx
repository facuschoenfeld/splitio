import { useEffect, useRef } from 'react'
import { useUIStore } from '@/stores/useUIStore'

export default function Modal({ name, title, children, onClose }) {
  const { activeModal, closeModal } = useUIStore()
  const overlayRef = useRef(null)

  const isOpen = activeModal === name
  // Permite que el modal corra lógica de limpieza (ej: resetear el step) al
  // cerrarse vía Escape, overlay o la X, no solo desde sus botones internos.
  const handleClose = onClose || closeModal

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose()
      }}
    >
      <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-surface-100 dark:border-primary-700/25">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-primary-700/15">
          <h2 className="text-base font-bold text-surface-900 dark:text-white">{title}</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-primary-600/10 transition-colors cursor-pointer"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
