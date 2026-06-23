import { useState, useEffect, useRef } from 'react'
import type { MaterialMode, VariantPreset } from '../types/material'
import { addMaterialWithLot } from '../db/materialQueries'
import { savePhoto } from '../db/queries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'
import MonthPicker from './MonthPicker'
import MaterialVariantPicker from './MaterialVariantPicker'
import MaterialNameField from './MaterialNameField'
import {
  ADD_VARIANT_PRESETS,
  VARIANT_PRESET_HINTS,
  VARIANT_PRESET_LABELS,
  normalizePresetForAdd,
} from '../utils/materialVariants'
import { normalizeQuantityInput, parseQuantityInput, QUICK_QUANTITY_OPTIONS } from '../utils/quantityInput'
import StorageLocationField from './StorageLocationField'
import { persistStorageLocation } from '../utils/storageLocation'
import type { MaterialSuggestion } from '../utils/materialSuggestions'

type MaterialKind = 'einfach' | 'variant'

interface AddMaterialSheetProps {
  open: boolean
  onClose: () => void
}

export default function AddMaterialSheet({ open, onClose }: AddMaterialSheetProps) {
  const refresh = useStore((s) => s.refresh)
  const materials = useStore((s) => s.materials)
  const [kind, setKind] = useState<MaterialKind>('einfach')
  const [einfachMode, setEinfachMode] = useState<'simple' | 'no_expiry'>('simple')
  const [variantPreset, setVariantPreset] = useState<VariantPreset>('groesse_nummer')
  const [variantLabel, setVariantLabel] = useState('')
  const [name, setName] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [loading, setLoading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setKind('einfach')
    setEinfachMode('simple')
    setVariantPreset('groesse_nummer')
    setVariantLabel('')
    setName('')
    setStorageLocation('')
    setExpiry('')
    setQtyInput('1')
    setLoading(false)
    setPhotoPreview(null)
    setPhotoFile(null)
  }, [open])

  useEffect(() => {
    if (kind !== 'variant') return
    setVariantLabel('')
  }, [variantPreset, kind])

  const isVariant = kind === 'variant'

  const canSave =
    name.trim().length > 0 &&
    (!isVariant || !!variantLabel) &&
    (parseQuantityInput(qtyInput) ?? 0) >= 1

  function applySuggestion(s: MaterialSuggestion) {
    setName(s.name)
    if (s.mode === 'variant') {
      setKind('variant')
      if (s.variant_preset) setVariantPreset(normalizePresetForAdd(s.variant_preset))
    } else {
      setKind('einfach')
      setEinfachMode(s.mode === 'no_expiry' ? 'no_expiry' : 'simple')
    }
    setVariantLabel('')
  }

  function handlePhotoSelect(file: File) {
    setPhotoFile(file)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  function clearPhoto() {
    setPhotoFile(null)
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setLoading(true)
    try {
      const location = await persistStorageLocation(storageLocation)
      const photo_blob_id = photoFile ? await savePhoto(photoFile) : undefined
      const mode: MaterialMode = isVariant ? 'variant' : einfachMode
      await addMaterialWithLot(
        {
          name: name.trim(),
          mode,
          variant_preset: isVariant ? variantPreset : undefined,
          ...(location ? { storage_location: location } : {}),
          ...(photo_blob_id ? { photo_blob_id } : {}),
        },
        {
          expiry_date: expiry || undefined,
          variant_label: isVariant ? variantLabel : undefined,
          quantity: parseQuantityInput(qtyInput) ?? 1,
        },
      )
      await refresh()
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
        form="add-material-form"
        disabled={!canSave || loading}
        className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Speichern…' : 'Speichern'}
      </button>
    </div>
  )

  return (
    <BottomSheet open={open} onClose={onClose} title="Material hinzufügen" footer={footer}>
      <form id="add-material-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Art</span>
          <div className="grid grid-cols-1 gap-2">
            <ModeOption
              checked={kind === 'einfach'}
              onChange={() => {
                setKind('einfach')
                setEinfachMode('simple')
              }}
              title="Einfach"
              hint="z. B. Sterilium, Schere, Infusionsbesteck — MHD optional"
            />
            <ModeOption
              checked={kind === 'variant'}
              onChange={() => setKind('variant')}
              title="Mit Größe / Variante"
              hint="Venflon, Tubus, Guedel, Larynxmaske …"
            />
          </div>
        </div>

        <MaterialNameField
          name={name}
          onNameChange={setName}
          onSuggestionSelect={applySuggestion}
          localMaterials={materials}
        />

        {isVariant && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Varianten-Typ</label>
              <select
                value={variantPreset}
                onChange={(e) => setVariantPreset(e.target.value as VariantPreset)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
              >
                {ADD_VARIANT_PRESETS.map((preset) => (
                  <option key={preset} value={preset}>
                    {VARIANT_PRESET_LABELS[preset]} — {VARIANT_PRESET_HINTS[preset]}
                  </option>
                ))}
              </select>
            </div>
            <MaterialVariantPicker
              preset={variantPreset}
              value={variantLabel}
              onChange={setVariantLabel}
              required
            />
          </>
        )}

        <StorageLocationField value={storageLocation} onChange={setStorageLocation} />

        <MonthPicker value={expiry} onChange={setExpiry} label="Ablaufmonat (optional)" />

        <QuantityField qtyInput={qtyInput} onQtyChange={setQtyInput} />

        <MaterialPhotoField
          photoPreview={photoPreview}
          photoLoading={loading}
          onCapture={() => fileRef.current?.click()}
          onGallery={() => galleryRef.current?.click()}
          onRemove={clearPhoto}
          fileRef={fileRef}
          galleryRef={galleryRef}
          onFileSelect={handlePhotoSelect}
        />
      </form>
    </BottomSheet>
  )
}

function ModeOption({
  checked,
  onChange,
  title,
  hint,
}: {
  checked: boolean
  onChange: () => void
  title: string
  hint: string
}) {
  return (
    <label
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
        checked ? 'border-brand-navy bg-brand-navy-50' : 'border-gray-200'
      }`}
    >
      <input type="radio" checked={checked} onChange={onChange} className="accent-brand-navy" />
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
    </label>
  )
}

function QuantityField({
  qtyInput,
  onQtyChange,
}: {
  qtyInput: string
  onQtyChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Menge</label>
      <div className="flex items-center gap-2">
        {QUICK_QUANTITY_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onQtyChange(String(n))}
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
        onChange={(e) => onQtyChange(e.target.value)}
        onBlur={() => onQtyChange(normalizeQuantityInput(qtyInput))}
        className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
      />
    </div>
  )
}

function MaterialPhotoField({
  photoPreview,
  photoLoading,
  onCapture,
  onGallery,
  onRemove,
  fileRef,
  galleryRef,
  onFileSelect,
}: {
  photoPreview: string | null
  photoLoading: boolean
  onCapture: () => void
  onGallery: () => void
  onRemove: () => void
  fileRef: React.RefObject<HTMLInputElement | null>
  galleryRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (file: File) => void
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Material-Foto</p>
      {photoPreview ? (
        <div className="relative w-24 h-24">
          <img src={photoPreview} alt="" className="w-24 h-24 object-cover rounded-xl" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1 -right-1 bg-brand-navy text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCapture}
            disabled={photoLoading}
            className="flex-1 flex items-center justify-center gap-2 text-sm text-brand-navy border border-brand-navy/30 rounded-xl px-3 py-2 hover:bg-brand-navy-50"
          >
            Foto aufnehmen
          </button>
          <button
            type="button"
            onClick={onGallery}
            disabled={photoLoading}
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
          if (f) onFileSelect(f)
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
          if (f) onFileSelect(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
