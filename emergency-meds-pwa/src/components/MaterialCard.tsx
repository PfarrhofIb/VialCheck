import type { MaterialWithLots, MaterialLot } from '../types/material'
import PhotoThumb from './PhotoThumb'
import {
  formatLotLabel,
  getMaterialSubtitle,
  lotExpiryColorClass,
  materialHasExpiredLots,
  materialHasExpiringSoonLots,
  sortMaterialLots,
} from '../utils/materialDisplay'

interface MaterialCardProps {
  material: MaterialWithLots
  onConsume: (material: MaterialWithLots) => void
  onEdit: (material: MaterialWithLots) => void
  onAddLot: (material: MaterialWithLots) => void
}

export default function MaterialCard({ material, onConsume, onEdit, onAddLot }: MaterialCardProps) {
  const hasExpired = materialHasExpiredLots(material)
  const hasSoon = materialHasExpiringSoonLots(material)
  const isNoExpiry = material.mode === 'no_expiry'

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border p-4 ${
        isNoExpiry
          ? 'border-gray-200'
          : hasExpired
            ? 'border-red-300'
            : hasSoon
              ? 'border-yellow-300'
              : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {material.photo_blob_id && <PhotoThumb photoBlobId={material.photo_blob_id} />}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{material.name}</p>
              {hasExpired && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                  Abgelaufen
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{getMaterialSubtitle(material)}</p>
            {material.storage_location && (
              <p className="text-xs text-gray-500 mt-0.5">Einsortiert: {material.storage_location}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-gray-900">{material.totalQuantity}</span>
          <p className="text-xs text-gray-500">Gesamt</p>
        </div>
      </div>

      {material.lots.length > 0 && (
        <div className="mt-3 space-y-1">
          {sortMaterialLots(material.lots).map((lot) => (
            <LotRow key={lot.id} lot={lot} showExpiry={!isNoExpiry} />
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onConsume(material)}
          disabled={material.totalQuantity === 0}
          className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2 px-3 rounded-xl transition-colors"
        >
          1 Verbraucht
        </button>
        <button
          type="button"
          onClick={() => onAddLot(material)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 px-3 rounded-xl transition-colors"
        >
          + Bestand
        </button>
        <button
          type="button"
          onClick={() => onEdit(material)}
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

function LotRow({ lot, showExpiry }: { lot: MaterialLot; showExpiry: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={showExpiry && lot.expiry_date ? `font-mono ${lotExpiryColorClass(lot.expiry_date)}` : 'text-gray-600'}>
        {showExpiry && lot.expiry_date ? formatLotLabel(lot) : lot.variant_label || 'Ohne MHD'}
      </span>
      <span className="font-medium text-gray-700">{lot.quantity}×</span>
    </div>
  )
}
