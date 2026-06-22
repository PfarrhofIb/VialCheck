import { useState, useRef, useEffect, useCallback } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { getMedicationByBarcode } from '../db/queries'
import { parseGS1 } from '../utils/barcode'
import { useStore } from '../hooks/useStore'
import type { MedicationWithBatches } from '../types'
import AddBatchSheet from '../components/AddBatchSheet'
import AddMedicationSheet from '../components/AddMedicationSheet'
import Snackbar from '../components/Snackbar'

export default function ScannerPage() {
  const refresh = useStore((s) => s.refresh)
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [manualInput, setManualInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [foundMed, setFoundMed] = useState<MedicationWithBatches | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState('')
  const [unknownExpiry, setUnknownExpiry] = useState('')
  const [snack, setSnack] = useState<string | null>(null)
  const [torchOn, setTorchOn] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const handledRef = useRef(false)

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setScanning(false)
    handledRef.current = false
  }, [])

  const handleScanResult = useCallback(async (rawText: string) => {
    if (handledRef.current) return
    handledRef.current = true
    stopScanner()

    const parsed = parseGS1(rawText)
    const barcodeToSearch = parsed.gtin ?? rawText
    const expiry = parsed.expiryDate ?? ''

    const med = await getMedicationByBarcode(barcodeToSearch)
    if (med) {
      setFoundMed(med)
      setUnknownExpiry(expiry)
    } else {
      setUnknownBarcode(barcodeToSearch)
      setUnknownExpiry(expiry)
    }
  }, [stopScanner])

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return
    handledRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      setScanning(true)

      const reader = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (result) {
          handleScanResult(result.getText())
        } else if (err) {
          // NotFoundException is normal during scanning – ignore silently
        }
      })
      controlsRef.current = controls
    } catch {
      setSnack('Kamera nicht verfügbar. Bitte Test-Modus verwenden.')
      setMode('manual')
      setScanning(false)
    }
  }, [handleScanResult])

  useEffect(() => {
    return () => stopScanner()
  }, [stopScanner])

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualInput.trim()) return
    await handleScanResult(manualInput.trim())
    setManualInput('')
  }

  async function toggleTorch() {
    if (!streamRef.current) return
    const track = streamRef.current.getVideoTracks()[0]
    const newState = !torchOn
    try {
      await (track as MediaStreamTrack & { applyConstraints: (c: object) => Promise<void> })
        .applyConstraints({ advanced: [{ torch: newState }] })
      setTorchOn(newState)
    } catch {
      setSnack('Taschenlampe wird auf diesem Gerät nicht unterstützt.')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Scanner</h1>
          <button
            onClick={() => { stopScanner(); setMode(mode === 'camera' ? 'manual' : 'camera') }}
            className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            {mode === 'camera' ? 'Test-Modus' : 'Kamera'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mode === 'camera' ? (
          <div className="flex flex-col items-center p-4 gap-4">
            <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden aspect-[4/3]">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-56 border-2 border-white rounded-2xl opacity-60" />
                </div>
              )}
              {scanning && (
                <button
                  onClick={toggleTorch}
                  className={`absolute top-3 right-3 p-2 rounded-full ${torchOn ? 'bg-yellow-400 text-black' : 'bg-white/80 text-gray-800'}`}
                  aria-label="Taschenlampe"
                >
                  ⚡
                </button>
              )}
            </div>

            {!scanning ? (
              <button
                onClick={startScanner}
                className="w-full max-w-md bg-red-600 hover:bg-red-700 text-white font-semibold py-3.5 rounded-xl"
              >
                Scan starten
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="w-full max-w-md bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3.5 rounded-xl"
              >
                Scan stoppen
              </button>
            )}

            <p className="text-sm text-gray-400 text-center">
              Barcode / DataMatrix auf Kamera halten
            </p>
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
              <p className="text-sm text-blue-700">
                <strong>Test-Modus:</strong> Barcode manuell eingeben (z.B. für Entwicklung am PC)
              </p>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Barcode / PZN eingeben…"
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-3 rounded-xl"
              >
                Suchen
              </button>
            </form>
          </div>
        )}
      </div>

      <AddBatchSheet
        med={foundMed}
        initialExpiry={unknownExpiry}
        onClose={() => { setFoundMed(null); setUnknownExpiry('') }}
      />

      <AddMedicationSheet
        open={!!unknownBarcode}
        initialBarcode={unknownBarcode}
        initialExpiry={unknownExpiry}
        onClose={() => { setUnknownBarcode(''); setUnknownExpiry('') }}
        onAdded={() => refresh()}
      />

      <Snackbar message={snack} onDismiss={() => setSnack(null)} />
    </div>
  )
}
