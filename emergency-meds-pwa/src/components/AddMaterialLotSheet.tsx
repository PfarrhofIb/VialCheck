import { useState, useEffect } from 'react'
import type { MaterialWithLots } from '../types/material'
import { addOrUpdateMaterialLot } from '../db/materialQueries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'
import MonthPicker from './MonthPicker'
import MaterialVariantPicker from './MaterialVariantPicker'
import { normalizeQuantityInput, parseQuantityInput, QUICK_QUANTITY_OPTIONS } from '../utils/quantityInput'
import { materialNeedsExpiry } from '../utils/materialVariants'

interface AddMaterialLotSheetProps {
  material: MaterialWithLots | null
  onClose: () => void
}

export default function AddMaterialLotSheet({ material, onClose }: AddMaterialLotSheetProps) {
  const refresh = useStore((s) => s.refresh)
  const [variantLabel, setVariantLabel] = useState('')
  const [expiry, setExpiry] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!material) return
    setVariantLabel('')
    setExpiry('')
    setQtyInput('1')
    setLoading(false)
  }, [material?.id])

  if (!material) return null

  const needsExpiry = materialNeedsExpiry(material)
  const isVariant = material.mode === 'variant'

  const canSave =
    (!needsExpiry || !!expiry) &&
    (!isVariant || !!variantLabel) &&
    (parseQuantityInput(qtyInput) ?? 0) >= 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setLoading(true)
    try {
      const qty = parseQuantityInput(qtyInput) ?? 1
      await addOrUpdateMaterialLot(
        material!.id!,
        needsExpiry ? expiry : undefined,
        isVariant ? variantLabel : undefined,
        qty,
      )
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <div className="flex gap-3">
      <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700">
        Abbrechen
      </button>
      <button
        type="submit"
        form="add-material-lot-form"
        disabled={loading || !canSave}
        className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl"
      >
        {loading ? '…' : 'Speichern'}
      </button>
    </div>
  )

  return (
    <BottomSheet
      open={!!material}
      onClose={onClose}
      title={needsExpiry ? 'Bestand hinzufügen' : 'Menge erhöhen'}
      footer={footer}
    >
      <p className="text-sm text-gray-500 mb-4">{material.name}</p>
      <form id="add-material-lot-form" onSubmit={handleSubmit} className="space-y-4">
        {isVariant && material.variant_preset && (
          <MaterialVariantPicker
            preset={material.variant_preset}
            value={variantLabel}
            onChange={setVariantLabel}
            required
          />
        )}
        {needsExpiry && (
          <MonthPicker value={expiry} onChange={setExpiry} label="Ablaufmonat" required />
        )}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            {!needsExpiry && !isVariant ? 'Hinzufügen' : 'Menge'}
          </label>
          <div className="flex items-center gap-2">
            {QUICK_QUANTITY_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQtyInput(String(n))}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                  parseQuantityInput(qtyInput) === n ? 'bg-brand-navy text-white' : 'bg-gray-100'
                }`}
              >
                +{n}
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
      </form>
    </BottomSheet>
  )
}
