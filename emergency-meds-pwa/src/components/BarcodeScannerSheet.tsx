import { useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser/esm/common/IScannerControls'

interface BarcodeScannerSheetProps {
  open: boolean
  onClose: () => void
  onScan: (raw: string) => void
}

export default function BarcodeScannerSheet({ open, onClose, onScan }: BarcodeScannerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    if (!open) return

    processingRef.current = false
    const reader = new BrowserMultiFormatReader()
    let cancelled = false

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current ?? undefined,
        (result) => {
          if (cancelled || processingRef.current || !result) return
          processingRef.current = true
          controlsRef.current?.stop()
          onScan(result.getText())
        },
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
      })
      .catch(() => {
        if (!cancelled) onClose()
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
      processingRef.current = false
    }
  }, [open, onClose, onScan])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <h2 className="text-white font-semibold text-lg">Barcode scannen</h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
          aria-label="Scanner schließen"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
        <ScanOverlay />
      </div>
    </div>
  )
}

function ScanOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col">
      <div className="flex-[2] bg-black/45" />
      <div className="flex flex-row">
        <div className="flex-1 bg-black/45" />
        <div className="w-64 h-64 border-[3px] border-brand-navy rounded-xl" />
        <div className="flex-1 bg-black/45" />
      </div>
      <div className="flex-[3] bg-black/45 flex items-start justify-center pt-5 px-6">
        <p className="text-white/80 text-sm text-center">
          Barcode oder DataMatrix in den Rahmen halten
        </p>
      </div>
    </div>
  )
}
