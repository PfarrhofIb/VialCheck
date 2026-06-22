import { useEffect, useRef } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Inhalt der immer am Boden sichtbar bleibt (z.B. Speichern/Abbrechen) */
  footer?: React.ReactNode
}

export default function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative bg-white rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
      >
        {/* Drag-Handle + Titel */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 border-b border-gray-100">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="Schließen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollbarer Inhalt */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {children}
        </div>

        {/* Sticky Footer für Aktions-Buttons */}
        {footer && (
          <div
            className="shrink-0 px-4 pt-2 pb-4 border-t border-gray-100 bg-white"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
          >
            {footer}
          </div>
        )}
        {/* Ohne footer: safe-area padding am Ende */}
        {!footer && (
          <div style={{ height: 'env(safe-area-inset-bottom, 0px)', minHeight: 8 }} className="shrink-0" />
        )}
      </div>
    </div>
  )
}
