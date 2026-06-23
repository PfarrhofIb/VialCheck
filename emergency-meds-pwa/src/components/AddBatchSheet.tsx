import { useState, useEffect } from 'react'
import type { MedicationWithBatches } from '../types'
import { addOrUpdateBatch } from '../db/queries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'
import MonthPicker from './MonthPicker'
import MedicationNameDisplay from './MedicationNameDisplay'
import { normalizeQuantityInput, parseQuantityInput, QUICK_QUANTITY_OPTIONS } from '../utils/quantityInput'

interface AddBatchSheetProps {
  med: MedicationWithBatches | null
  initialExpiry?: string
  initialQty?: number
  onClose: () => void
}

export default function AddBatchSheet({
  med,
  initialExpiry = '',
  initialQty = 1,
  onClose,
}: AddBatchSheetProps) {
  const refresh = useStore((s) => s.refresh)
  const [expiry, setExpiry] = useState('')
  const [qtyInput, setQtyInput] = useState('1')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!med) return
    setExpiry(initialExpiry)
    setQtyInput(String(initialQty))
    setLoading(false)
  }, [med?.id, initialExpiry, initialQty])

  if (!med) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!expiry) return
    setLoading(true)
    try {
      await addOrUpdateBatch(med!.id!, expiry, parseQuantityInput(qtyInput) ?? 1)
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
        form="add-batch-form"
        disabled={!expiry || loading}
        className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        {loading ? 'Speichern…' : 'Speichern'}
      </button>
    </div>
  )

  return (
    <BottomSheet open={!!med} onClose={onClose} title="Charge hinzufügen" footer={footer}>
      <div className="mb-4">
        <MedicationNameDisplay med={med} primaryClassName="text-sm text-gray-500" />
      </div>
      <form id="add-batch-form" onSubmit={handleSubmit} className="space-y-4">
        <MonthPicker
          value={expiry}
          onChange={setExpiry}
          label="Ablaufmonat"
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Menge</label>
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
                +{n}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={1}
            max={999}
            value={qtyInput}
            onChange={(e) => setQtyInput(e.target.value)}
            onBlur={() => setQtyInput((v) => normalizeQuantityInput(v))}
            className="mt-1 border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
            placeholder="Oder eigene Zahl eingeben"
          />
        </div>
      </form>
    </BottomSheet>
  )
}
