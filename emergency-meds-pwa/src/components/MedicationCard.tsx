import type { MedicationWithBatches, MedicationBatch } from '../types'
import { formatYearMonth, expiryColorClass, isExpired, isExpiringSoon } from '../utils/expiry'
import MedicationNameDisplay from './MedicationNameDisplay'
import { formatConcentrationLine } from '../utils/medicationDisplay'
interface MedicationCardProps {
  med: MedicationWithBatches
  onConsume: (med: MedicationWithBatches) => void
  onEdit: (med: MedicationWithBatches) => void
  onAddBatch: (med: MedicationWithBatches) => void
}

export default function MedicationCard({ med, onConsume, onEdit, onAddBatch }: MedicationCardProps) {
  const hasExpired = med.batches.some((b) => isExpired(b.expiry_date) && b.quantity > 0)
  const hasSoon = med.batches.some((b) => isExpiringSoon(b.expiry_date) && b.quantity > 0)
  const concentrationLine = formatConcentrationLine(med)

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${hasExpired ? 'border-red-300' : hasSoon ? 'border-yellow-300' : 'border-gray-100'} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap flex-1 min-w-0">
            <MedicationNameDisplay med={med} />
            {hasExpired && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                Abgelaufen
              </span>
            )}
          </div>
          {concentrationLine && (
            <p className="text-xs text-gray-500 mt-0.5">{concentrationLine}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-gray-900">{med.totalQuantity}</span>
          <p className="text-xs text-gray-500">Gesamt</p>
        </div>
      </div>

      {/* Chargen */}
      {med.batches.length > 0 && (
        <div className="mt-3 space-y-1">
          {[...med.batches]
            .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
            .map((batch) => (
              <BatchRow key={batch.id} batch={batch} />
            ))}
        </div>
      )}

      {/* Aktionen */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={() => onConsume(med)}
          disabled={med.totalQuantity === 0}
          className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2 px-3 rounded-xl transition-colors"
        >
          1 Verbraucht
        </button>
        <button
          onClick={() => onAddBatch(med)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 px-3 rounded-xl transition-colors"
        >
          + Charge
        </button>
        <button
          onClick={() => onEdit(med)}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600"
          aria-label="Bearbeiten"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function BatchRow({ batch }: { batch: MedicationBatch }) {
  const colorClass = expiryColorClass(batch.expiry_date)
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={`font-mono ${colorClass}`}>{formatYearMonth(batch.expiry_date)}</span>
      <span className="font-medium text-gray-700">{batch.quantity}×</span>
    </div>
  )
}
