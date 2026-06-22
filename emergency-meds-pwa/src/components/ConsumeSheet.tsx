import { useState } from 'react'
import type { MedicationWithBatches, MedicationBatch } from '../types'
import { formatYearMonth, expiryColorClass, isExpired } from '../utils/expiry'
import { decrementBatch, addOrIncrementRefill } from '../db/queries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'
import MedicationNameDisplay from './MedicationNameDisplay'

interface ConsumeSheetProps {
  med: MedicationWithBatches | null
  onClose: () => void
}

export default function ConsumeSheet({ med, onClose }: ConsumeSheetProps) {
  const refresh = useStore((s) => s.refresh)
  const [loading, setLoading] = useState(false)

  if (!med) return null

  const availableBatches = med.batches
    .filter((b) => b.quantity > 0)
    .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))

  async function handleConsume(batch: MedicationBatch) {
    setLoading(true)
    try {
      await decrementBatch(batch.id!)
      await addOrIncrementRefill(med!.id!)
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <button
      onClick={onClose}
      className="w-full py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
    >
      Abbrechen
    </button>
  )

  return (
    <BottomSheet open={!!med} onClose={onClose} title="Welche Charge wurde verbraucht?" footer={footer}>
      <div className="mb-4">
        <MedicationNameDisplay med={med} primaryClassName="text-sm font-medium text-gray-700" />
      </div>
      <div className="space-y-2">
        {availableBatches.map((batch) => (
          <button
            key={batch.id}
            onClick={() => handleConsume(batch)}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isExpired(batch.expiry_date) ? 'bg-red-500' : 'bg-brand-green'}`} />
              <span className={`font-mono font-medium ${expiryColorClass(batch.expiry_date)}`}>
                {formatYearMonth(batch.expiry_date)}
              </span>
            </div>
            <span className="text-gray-600 text-sm">{batch.quantity}× verfügbar</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
