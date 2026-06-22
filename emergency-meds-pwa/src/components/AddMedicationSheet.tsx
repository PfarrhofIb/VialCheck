import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { addMedication, findExistingMedication, addOrUpdateBatch } from '../db/queries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'
import MonthPicker from './MonthPicker'
import MedicationNameFields from './MedicationNameFields'
import { runOcr } from '../utils/ocr'
import { hasAnyName, type DisplayNameField } from '../utils/medicationDisplay'
import { normalizeQuantityInput, parseQuantityInput, QUICK_QUANTITY_OPTIONS } from '../utils/quantityInput'

interface AddMedicationSheetProps {
  open: boolean
  initialBarcode?: string
  initialName?: string
  initialExpiry?: string
  onClose: () => void
  onAdded?: (medicationId: number) => void
}

export default function AddMedicationSheet({
  open,
  initialBarcode = '',
  initialName = '',
  initialExpiry = '',
  onClose,
  onAdded,
}: AddMedicationSheetProps) {
  const refresh = useStore((s) => s.refresh)
  const [handelsname, setHandelsname] = useState('')
  const [wirkstoffname, setWirkstoffname] = useState('')
  const [displayName, setDisplayName] = useState<DisplayNameField>('handelsname')
  const [barcode, setBarcode] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [mlPerAmpule, setMlPerAmpule] = useState('')
  const [mgPerMl, setMgPerMl] = useState('')
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [snack, setSnack] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setHandelsname(initialName)
    setWirkstoffname('')
    setDisplayName('handelsname')
    setExpiry(initialExpiry)
    setQtyInput('1')
    setMlPerAmpule('')
    setMgPerMl('')
    setSnack('')
    setLoading(false)
    setOcrLoading(false)
    setBarcode(initialBarcode || `manual_${uuidv4()}`)
  }, [open, initialName, initialExpiry, initialBarcode])

  async function handlePhotoOcr(file: File) {
    setOcrLoading(true)
    try {
      const result = await runOcr(file)
      if (result.name) setHandelsname(result.name)
      if (result.expiryDate) setExpiry(result.expiryDate)
      if (result.mlPerAmpule) setMlPerAmpule(result.mlPerAmpule.toString())
      if (result.mgPerMl) setMgPerMl(result.mgPerMl.toString())
      if (!result.name && !result.expiryDate) {
        setSnack('Kein Text erkannt. Bitte Daten manuell eingeben.')
      }
    } finally {
      setOcrLoading(false)
    }
  }

  const canSave = hasAnyName(handelsname, wirkstoffname) && !!expiry

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setLoading(true)
    try {
      const existing = await findExistingMedication(handelsname, wirkstoffname)
      let medId: number
      if (existing) {
        medId = existing.id!
      } else {
        medId = await addMedication({
          barcode: initialBarcode || barcode,
          handelsname: handelsname.trim(),
          wirkstoffname: wirkstoffname.trim(),
          display_name: displayName,
          ml_per_ampule: mlPerAmpule ? parseFloat(mlPerAmpule) : undefined,
          mg_per_ml: mgPerMl ? parseFloat(mgPerMl) : undefined,
        })
      }
      await addOrUpdateBatch(medId, expiry, parseQuantityInput(qtyInput) ?? 1)
      await refresh()
      onAdded?.(medId)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
      >
        Abbrechen
      </button>
      <button
        type="submit"
        form="add-med-form"
        disabled={!canSave || loading}
        className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Speichern…' : 'Speichern'}
      </button>
    </div>
  )

  return (
    <BottomSheet open={open} onClose={onClose} title="Medikament hinzufügen" footer={footer}>
      {snack && (
        <div className="mb-3 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg">
          {snack}
        </div>
      )}
      <form id="add-med-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={ocrLoading}
            className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-600 hover:border-brand-navy hover:text-brand-navy transition-colors"
          >
            {ocrLoading ? (
              <span className="animate-pulse text-xs">OCR läuft…</span>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Foto aufnehmen</span>
                <span className="text-xs text-gray-400">Kamera + OCR</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={ocrLoading}
            className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-600 hover:border-brand-navy hover:text-brand-navy transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">Aus Galerie</span>
            <span className="text-xs text-gray-400">Bild + OCR</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handlePhotoOcr(f)
            e.target.value = ''
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handlePhotoOcr(f)
            e.target.value = ''
          }}
        />

        <MedicationNameFields
          handelsname={handelsname}
          wirkstoffname={wirkstoffname}
          displayName={displayName}
          onHandelsnameChange={setHandelsname}
          onWirkstoffnameChange={setWirkstoffname}
          onDisplayNameChange={setDisplayName}
        />

        <MonthPicker value={expiry} onChange={setExpiry} label="Ablaufmonat" required />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Menge <span className="text-brand-navy">*</span></label>
          <div className="flex items-center gap-2">
            {QUICK_QUANTITY_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQtyInput(String(n))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  parseQuantityInput(qtyInput) === n ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            onBlur={() => setQtyInput((v) => normalizeQuantityInput(v))}
            className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">ml/Ampulle</label>
            <input
              type="number" step="0.1" min="0"
              value={mlPerAmpule}
              onChange={(e) => setMlPerAmpule(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
              placeholder="5"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">mg/ml</label>
            <input
              type="number" step="0.1" min="0"
              value={mgPerMl}
              onChange={(e) => setMgPerMl(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
              placeholder="10"
            />
          </div>
        </div>
      </form>
    </BottomSheet>
  )
}
