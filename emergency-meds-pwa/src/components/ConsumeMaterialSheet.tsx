import { useState } from 'react'
import type { MaterialWithLots, MaterialLot } from '../types/material'
import { expiryColorClass, isExpired } from '../utils/expiry'
import { formatLotLabel, sortMaterialLots } from '../utils/materialDisplay'
import { decrementMaterialLot, addOrIncrementMaterialRefill } from '../db/materialQueries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'

interface ConsumeMaterialSheetProps {
  material: MaterialWithLots | null
  onClose: () => void
}

export default function ConsumeMaterialSheet({ material, onClose }: ConsumeMaterialSheetProps) {
  const refresh = useStore((s) => s.refresh)
  const [loading, setLoading] = useState(false)

  if (!material) return null

  const availableLots = sortMaterialLots(material.lots.filter((l) => l.quantity > 0))

  async function handleConsume(lot: MaterialLot) {
    const materialId = material!.id!
    setLoading(true)
    try {
      await decrementMaterialLot(lot.id!)
      await addOrIncrementMaterialRefill(materialId)
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="w-full py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
    >
      Abbrechen
    </button>
  )

  const title =
    availableLots.length === 1 ? '1 Stück verbraucht?' : 'Welchen Bestand wurde verbraucht?'

  return (
    <BottomSheet open={!!material} onClose={onClose} title={title} footer={footer}>
      <p className="text-sm font-medium text-gray-700 mb-4">{material.name}</p>
      <div className="space-y-2">
        {availableLots.map((lot) => (
          <button
            key={lot.id}
            type="button"
            onClick={() => handleConsume(lot)}
            disabled={loading}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              {lot.expiry_date ? (
                <>
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isExpired(lot.expiry_date) ? 'bg-red-500' : 'bg-brand-green'
                    }`}
                  />
                  <span className={`font-mono font-medium ${expiryColorClass(lot.expiry_date)}`}>
                    {formatLotLabel(lot)}
                  </span>
                </>
              ) : (
                <span className="text-gray-700">{lot.variant_label || 'Ohne MHD'}</span>
              )}
            </div>
            <span className="text-gray-600 text-sm shrink-0 ml-2">{lot.quantity}×</span>
          </button>
        ))}
      </div>
      {availableLots.length === 1 && (
        <button
          type="button"
          onClick={() => handleConsume(availableLots[0])}
          disabled={loading}
          className="mt-4 w-full bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold py-3 rounded-xl"
        >
          Bestätigen
        </button>
      )}
    </BottomSheet>
  )
}
