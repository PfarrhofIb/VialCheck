import { useState, useEffect } from 'react'
import type { MaterialMode, VariantPreset } from '../types/material'
import { addMaterialWithLot } from '../db/materialQueries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'
import MonthPicker from './MonthPicker'
import MaterialVariantPicker from './MaterialVariantPicker'
import MaterialNameField from './MaterialNameField'
import {
  ALL_VARIANT_PRESETS,
  VARIANT_PRESET_HINTS,
  VARIANT_PRESET_LABELS,
  materialNeedsExpiry,
} from '../utils/materialVariants'
import { normalizeQuantityInput, parseQuantityInput, QUICK_QUANTITY_OPTIONS } from '../utils/quantityInput'
import StorageLocationField from './StorageLocationField'
import { persistStorageLocation } from '../utils/storageLocation'
import type { MaterialSuggestion } from '../utils/materialSuggestions'

interface AddMaterialSheetProps {
  open: boolean
  onClose: () => void
}

export default function AddMaterialSheet({ open, onClose }: AddMaterialSheetProps) {
  const refresh = useStore((s) => s.refresh)
  const materials = useStore((s) => s.materials)
  const [mode, setMode] = useState<MaterialMode>('simple')
  const [variantPreset, setVariantPreset] = useState<VariantPreset>('tubus_mm')
  const [variantLabel, setVariantLabel] = useState('')
  const [name, setName] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setMode('simple')
    setVariantPreset('tubus_mm')
    setVariantLabel('')
    setName('')
    setStorageLocation('')
    setExpiry('')
    setQtyInput('1')
    setLoading(false)
  }, [open])

  useEffect(() => {
    if (mode !== 'variant') return
    setVariantLabel('')
  }, [variantPreset, mode])

  const needsExpiry = materialNeedsExpiry({
    mode,
    variant_preset: mode === 'variant' ? variantPreset : undefined,
  })
  const needsVariant = mode === 'variant'

  const canSave =
    name.trim().length > 0 &&
    (!needsExpiry || !!expiry) &&
    (!needsVariant || !!variantLabel) &&
    (parseQuantityInput(qtyInput) ?? 0) >= 1

  function applySuggestion(s: MaterialSuggestion) {
    setName(s.name)
    setMode(s.mode)
    if (s.variant_preset) setVariantPreset(s.variant_preset)
    setVariantLabel('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setLoading(true)
    try {
      const location = await persistStorageLocation(storageLocation)
      await addMaterialWithLot(
        {
          name: name.trim(),
          mode,
          variant_preset: mode === 'variant' ? variantPreset : undefined,
          ...(location ? { storage_location: location } : {}),
        },
        {
          expiry_date: needsExpiry ? expiry : undefined,
          variant_label: mode === 'variant' ? variantLabel : undefined,
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
              checked={mode === 'simple'}
              onChange={() => setMode('simple')}
              title="Einfach (mit MHD)"
              hint="z. B. Sterilium, Infusionsbesteck"
            />
            <ModeOption
              checked={mode === 'variant'}
              onChange={() => setMode('variant')}
              title="Mit Größe / Variante"
              hint="Venflon, Tubus, Spritze, Larynxmaske …"
            />
            <ModeOption
              checked={mode === 'no_expiry'}
              onChange={() => setMode('no_expiry')}
              title="Ohne MHD"
              hint="z. B. Schere, Ambubeutel"
            />
          </div>
        </div>

        <MaterialNameField
          name={name}
          onNameChange={setName}
          onSuggestionSelect={applySuggestion}
          localMaterials={materials}
        />

        {mode === 'variant' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Varianten-Typ</label>
            <select
              value={variantPreset}
              onChange={(e) => setVariantPreset(e.target.value as VariantPreset)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
            >
              {ALL_VARIANT_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {VARIANT_PRESET_LABELS[preset]} — {VARIANT_PRESET_HINTS[preset]}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'variant' && (
          <MaterialVariantPicker
            preset={variantPreset}
            value={variantLabel}
            onChange={setVariantLabel}
            required
          />
        )}

        <StorageLocationField value={storageLocation} onChange={setStorageLocation} />

        {needsExpiry && (
          <MonthPicker value={expiry} onChange={setExpiry} label="Ablaufmonat" required />
        )}

        <QuantityField qtyInput={qtyInput} onQtyChange={setQtyInput} />
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
