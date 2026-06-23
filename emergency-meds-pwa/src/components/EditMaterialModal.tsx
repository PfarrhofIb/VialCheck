import { useState, useEffect } from 'react'
import type { MaterialWithLots } from '../types/material'
import {
  updateMaterial,
  deleteMaterial,
  updateMaterialLot,
  deleteMaterialLot,
} from '../db/materialQueries'
import { useStore } from '../hooks/useStore'
import Modal from './Modal'
import MonthPicker from './MonthPicker'
import MaterialVariantPicker from './MaterialVariantPicker'
import { parseQuantityInput } from '../utils/quantityInput'

interface EditMaterialModalProps {
  material: MaterialWithLots | null
  onClose: () => void
}

export default function EditMaterialModal({ material, onClose }: EditMaterialModalProps) {
  const refresh = useStore((s) => s.refresh)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!material) return
    setName(material.name)
  }, [material])

  if (!material) return null

  const hasExpiry = material.mode === 'simple' || material.mode === 'variant'
  const isVariant = material.mode === 'variant'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await updateMaterial(material!.id!, { name: name.trim() })
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`„${material!.name}" wirklich löschen?`)) return
    await deleteMaterial(material!.id!)
    await refresh()
    onClose()
  }

  async function updateLotQty(lotId: number, value: string) {
    const qty = parseQuantityInput(value)
    if (qty == null || qty < 1) return
    await updateMaterialLot(lotId, { quantity: qty })
    await refresh()
  }

  async function updateLotExpiry(lotId: number, expiry: string) {
    await updateMaterialLot(lotId, { expiry_date: expiry })
    await refresh()
  }

  async function updateLotVariant(lotId: number, variantLabel: string) {
    if (!variantLabel) return
    await updateMaterialLot(lotId, { variant_label: variantLabel })
    await refresh()
  }

  async function removeLot(lotId: number) {
    await deleteMaterialLot(lotId)
    await refresh()
  }

  return (
    <Modal open={!!material} onClose={onClose} title="Material bearbeiten">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
            required
          />
        </div>

        {material.lots.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Bestand</p>
            {material.lots.map((lot) => (
              <div key={lot.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
                {isVariant && material.variant_preset && (
                  <MaterialVariantPicker
                    preset={material.variant_preset}
                    value={lot.variant_label ?? ''}
                    onChange={(v) => updateLotVariant(lot.id!, v)}
                  />
                )}
                {hasExpiry && (
                  <MonthPicker
                    value={lot.expiry_date ?? ''}
                    onChange={(v) => updateLotExpiry(lot.id!, v)}
                    label="Ablaufmonat"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Menge</label>
                  <input
                    type="number"
                    min={1}
                    defaultValue={lot.quantity}
                    onBlur={(e) => updateLotQty(lot.id!, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
                  />
                </div>
                {material.lots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLot(lot.id!)}
                    className="text-xs text-red-600"
                  >
                    Eintrag entfernen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700">
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl"
          >
            {loading ? '…' : 'Speichern'}
          </button>
        </div>
        <button type="button" onClick={handleDelete} className="w-full text-red-600 text-sm py-2">
          Material löschen
        </button>
      </form>
    </Modal>
  )
}
