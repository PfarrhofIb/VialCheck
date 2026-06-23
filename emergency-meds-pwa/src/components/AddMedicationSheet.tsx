import { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { addMedication, findExistingMedication, addOrUpdateBatch, updateMedication, savePhoto } from '../db/queries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'
import MonthPicker from './MonthPicker'
import MedicationNameFields from './MedicationNameFields'
import { runOcr } from '../utils/ocr'
import { hasAnyName, type DisplayNameField } from '../utils/medicationDisplay'
import type { MedicationSuggestion } from '../utils/medicationSuggestions'
import { normalizeQuantityInput, parseQuantityInput, QUICK_QUANTITY_OPTIONS } from '../utils/quantityInput'
import StorageLocationField from './StorageLocationField'
import { persistStorageLocation } from '../utils/storageLocation'

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
  const medications = useStore((s) => s.medications)
  const [handelsname, setHandelsname] = useState('')
  const [wirkstoffname, setWirkstoffname] = useState('')
  const [displayName, setDisplayName] = useState<DisplayNameField>('handelsname')
  const [barcode, setBarcode] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [mlPerAmpule, setMlPerAmpule] = useState('')
  const [mgPerMl, setMgPerMl] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
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
    setStorageLocation('')
    setSnack('')
    setLoading(false)
    setOcrLoading(false)
    setPhotoFile(null)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setBarcode(initialBarcode || `manual_${uuidv4()}`)
  }, [open, initialName, initialExpiry, initialBarcode])

  async function handlePhotoSelect(file: File) {
    setPhotoFile(file)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
    setOcrLoading(true)
    try {
      const result = await runOcr(file)
      if (result.name) setHandelsname(result.name)
      if (result.expiryDate) setExpiry(result.expiryDate)
      if (result.mlPerAmpule) setMlPerAmpule(result.mlPerAmpule.toString())
      if (result.mgPerMl) setMgPerMl(result.mgPerMl.toString())
      if (!result.name && !result.expiryDate) {
        setSnack('Kein Text erkannt. Bitte Daten manuell eingeben.')
      } else {
        setSnack('')
      }
    } finally {
      setOcrLoading(false)
    }
  }

  function clearPhoto() {
    setPhotoFile(null)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  const canSave = hasAnyName(handelsname, wirkstoffname) && !!expiry

  function applySuggestion(s: MedicationSuggestion) {
    if (s.ml_per_ampule != null) setMlPerAmpule(String(s.ml_per_ampule))
    if (s.mg_per_ml != null) setMgPerMl(String(s.mg_per_ml))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setLoading(true)
    try {
      const location = await persistStorageLocation(storageLocation)
      const photo_blob_id = photoFile ? await savePhoto(photoFile) : undefined
      const existing = await findExistingMedication(handelsname, wirkstoffname)
      let medId: number
      if (existing) {
        medId = existing.id!
        await updateMedication(medId, {
          storage_location: location,
          ...(photo_blob_id ? { photo_blob_id } : {}),
        })
      } else {
        medId = await addMedication({
          barcode: initialBarcode || barcode,
          handelsname: handelsname.trim(),
          wirkstoffname: wirkstoffname.trim(),
          display_name: displayName,
          ...(location ? { storage_location: location } : {}),
          ...(photo_blob_id ? { photo_blob_id } : {}),
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
        <MedicationNameFields
          handelsname={handelsname}
          wirkstoffname={wirkstoffname}
          displayName={displayName}
          onHandelsnameChange={setHandelsname}
          onWirkstoffnameChange={setWirkstoffname}
          onDisplayNameChange={setDisplayName}
          localMedications={medications}
          onSuggestionSelect={applySuggestion}
        />

        <MonthPicker value={expiry} onChange={setExpiry} label="Ablaufmonat" required />

        <StorageLocationField value={storageLocation} onChange={setStorageLocation} />

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

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Ampullen-Foto</p>
          {photoPreview ? (
            <div className="relative w-24 h-24">
              <img src={photoPreview} alt="Ampulle" className="w-24 h-24 object-cover rounded-xl" />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute -top-1 -right-1 bg-brand-navy text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={ocrLoading}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-brand-navy border border-brand-navy/30 rounded-xl px-3 py-2 hover:bg-brand-navy-50"
              >
                {ocrLoading ? 'OCR läuft…' : 'Foto aufnehmen'}
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={ocrLoading}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-600 border border-gray-300 rounded-xl px-3 py-2 hover:bg-gray-50"
              >
                Galerie
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handlePhotoSelect(f)
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
              if (f) handlePhotoSelect(f)
              e.target.value = ''
            }}
          />
        </div>
      </form>
    </BottomSheet>
  )
}
