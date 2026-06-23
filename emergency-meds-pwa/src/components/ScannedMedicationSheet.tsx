import type { MedicationWithBatches } from '../types'
import { addOrUpdateBatch } from '../db/queries'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'
import MedicationNameDisplay from './MedicationNameDisplay'
import { formatYearMonth } from '../utils/expiry'

interface ScannedMedicationSheetProps {
  med: MedicationWithBatches | null
  scannedExpiry?: string
  onClose: () => void
  onOpenAddBatch: (med: MedicationWithBatches, expiry?: string, qty?: number) => void
}

const QUICK_AMOUNTS = [1, 5, 10, 20] as const

export default function ScannedMedicationSheet({
  med,
  scannedExpiry,
  onClose,
  onOpenAddBatch,
}: ScannedMedicationSheetProps) {
  const refresh = useStore((s) => s.refresh)

  if (!med) return null

  const activeBatches = med.batches.filter((b) => b.quantity > 0)

  async function quickAdd(qty: number) {
    if (scannedExpiry) {
      await addOrUpdateBatch(med!.id!, scannedExpiry, qty)
      await refresh()
      onClose()
      return
    }
    onOpenAddBatch(med!, undefined, qty)
  }

  return (
    <BottomSheet open={!!med} onClose={onClose} title="Medikament gefunden">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-green-50 text-green-600 shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <MedicationNameDisplay med={med} primaryClassName="text-lg font-bold text-gray-900" />
        </div>

        <div className="text-sm text-gray-600">
          <span className="text-gray-500">Gesamtbestand: </span>
          <span className="font-semibold text-gray-900">{med.totalQuantity} Stk.</span>
        </div>

        {scannedExpiry && (
          <div className="text-sm text-gray-600">
            <span className="text-gray-500">MHD aus Scan: </span>
            <span className="font-semibold text-gray-900">{formatYearMonth(scannedExpiry)}</span>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Chargen</p>
          {activeBatches.length === 0 ? (
            <p className="text-sm text-gray-500">Kein Bestand – bitte Charge mit MHD hinzufügen.</p>
          ) : (
            <ul className="space-y-1">
              {activeBatches.map((batch) => (
                <li key={batch.id} className="text-sm font-medium text-gray-800">
                  {batch.quantity}× {formatYearMonth(batch.expiry_date)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Charge hinzufügen</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => quickAdd(n)}
                className="py-2.5 rounded-xl border-2 border-brand-navy text-brand-navy font-semibold text-sm hover:bg-brand-navy-50 transition-colors"
              >
                +{n}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onOpenAddBatch(med, scannedExpiry)}
            className="mt-3 w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Charge mit Ablaufmonat…
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-gray-500 text-sm py-2"
        >
          Schließen
        </button>
      </div>
    </BottomSheet>
  )
}
