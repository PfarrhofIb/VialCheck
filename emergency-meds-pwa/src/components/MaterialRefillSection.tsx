import { useState } from 'react'
import type { Material, MaterialLot, MaterialRefillItemWithName } from '../types/material'
import type { MaterialExpiryGroup } from '../db/materialQueries'
import {
  removeMaterialRefillItem,
  addOrUpdateMaterialLot,
  deleteMaterialLot,
  markMaterialLotsOrdered,
  unmarkMaterialLotsOrdered,
  markMaterialRefillOrdered,
  unmarkMaterialRefillOrdered,
} from '../db/materialQueries'
import { expiryColorClass } from '../utils/expiry'
import { formatLotLabel, getMaterialSubtitle } from '../utils/materialDisplay'
import Modal from './Modal'
import MonthPicker from './MonthPicker'
import MaterialVariantPicker from './MaterialVariantPicker'
import { normalizeQuantityInput, parseQuantityInput } from '../utils/quantityInput'
import { useStore } from '../hooks/useStore'

const REFILL_ACTION_BTN =
  'w-[8.75rem] py-2.5 text-sm font-medium rounded-xl transition-colors text-center leading-tight'

function RefillActionButtons({
  ordered,
  onOrder,
  onUnorder,
  onDone,
  doneLabel,
}: {
  ordered: boolean
  onOrder: () => void
  onUnorder: () => void
  onDone: () => void
  doneLabel: string
}) {
  return (
    <div className="flex flex-col gap-2 shrink-0">
      {ordered ? (
        <button
          type="button"
          onClick={onUnorder}
          className={`${REFILL_ACTION_BTN} border border-brand-navy text-brand-navy hover:bg-brand-navy-50 text-xs`}
        >
          Bestellt zurücknehmen
        </button>
      ) : (
        <button
          type="button"
          onClick={onOrder}
          className={`${REFILL_ACTION_BTN} border border-brand-navy text-brand-navy hover:bg-brand-navy-50`}
        >
          Bestellt
        </button>
      )}
      <button
        type="button"
        onClick={onDone}
        className={`${REFILL_ACTION_BTN} bg-brand-navy hover:bg-brand-navy-dark text-white`}
      >
        {doneLabel}
      </button>
    </div>
  )
}

export function MaterialRefillVerbrauchtSection({
  items,
  orderedIds,
  variant,
}: {
  items: MaterialRefillItemWithName[]
  orderedIds: Set<number>
  variant: 'pending' | 'ordered'
}) {
  const refresh = useStore((s) => s.refresh)
  const [dialog, setDialog] = useState<MaterialRefillItemWithName | null>(null)
  const filtered = items.filter((item) => {
    const isOrdered = item.id != null && orderedIds.has(item.id)
    return variant === 'ordered' ? isOrdered : !isOrdered
  })

  if (!filtered.length) return null

  return (
    <>
      <div className="space-y-3 mt-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border shadow-sm p-4 ${
              variant === 'ordered' ? 'bg-brand-navy-50 border-brand-navy/20' : 'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Material</p>
                <p className="font-semibold text-gray-900">{item.material_name}</p>
                <p className="text-sm text-gray-500 mt-0.5">Benötigt: {item.amount_needed}×</p>
                {variant === 'ordered' && (
                  <p className="text-xs text-brand-navy mt-1">Bereit zum Einsortieren</p>
                )}
              </div>
              <RefillActionButtons
                ordered={variant === 'ordered'}
                onOrder={async () => {
                  await markMaterialRefillOrdered(item.id!, item.material_id)
                  await refresh()
                }}
                onUnorder={async () => {
                  await unmarkMaterialRefillOrdered(item.id!)
                  await refresh()
                }}
                onDone={() => setDialog(item)}
                doneLabel="Aufgefüllt"
              />
            </div>
          </div>
        ))}
      </div>
      {dialog && <MaterialRefillDialog item={dialog} onClose={() => setDialog(null)} />}
    </>
  )
}

function MaterialExpiryCard({
  group,
  variant,
  ordered,
  onOrder,
  onUnorder,
  onReplace,
}: {
  group: MaterialExpiryGroup
  variant: 'expired' | 'soon'
  ordered: boolean
  onOrder: () => void
  onUnorder: () => void
  onReplace: () => void
}) {
  const { material, lots } = group
  const isExpired = variant === 'expired'
  const baseStyle = ordered
    ? 'bg-brand-navy-50 border-brand-navy/20'
    : isExpired
      ? 'bg-red-50 border-red-200'
      : 'bg-yellow-50 border-yellow-200'

  return (
    <div className={`rounded-2xl border shadow-sm p-4 ${baseStyle}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Material</p>
          <p
            className={`font-semibold ${
              ordered ? 'text-brand-navy' : isExpired ? 'text-red-900' : 'text-yellow-900'
            }`}
          >
            {material.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{getMaterialSubtitle(material)}</p>
          <div className="mt-1 space-y-0.5">
            {lots.map((b) => (
              <p key={b.id} className={`text-sm font-mono ${expiryColorClass(b.expiry_date!)}`}>
                {formatLotLabel(b)} · {b.quantity}×
              </p>
            ))}
          </div>
          {ordered && <p className="text-xs text-brand-navy mt-1">Bereit zum Einsortieren</p>}
        </div>
        <RefillActionButtons
          ordered={ordered}
          onOrder={onOrder}
          onUnorder={onUnorder}
          onDone={onReplace}
          doneLabel="Ersetzt"
        />
      </div>
    </div>
  )
}

export function MaterialExpirySection({
  groups,
  variant,
  orderedLotIds,
  listVariant,
}: {
  groups: MaterialExpiryGroup[]
  variant: 'expired' | 'soon'
  orderedLotIds: Set<number>
  listVariant: 'pending' | 'ordered'
}) {
  const refresh = useStore((s) => s.refresh)
  const [dialog, setDialog] = useState<{
    material: Material
    lots: MaterialLot[]
    soon: boolean
  } | null>(null)

  const filtered = groups.filter((group) => {
    const withId = group.lots.filter((l) => l.id != null)
    const allOrdered =
      withId.length > 0 && withId.every((l) => orderedLotIds.has(l.id!))
    return listVariant === 'ordered' ? allOrdered : !allOrdered
  })

  if (!filtered.length) return null

  return (
    <>
      <div className="space-y-3 mt-3">
        {filtered.map((group) => (
          <MaterialExpiryCard
            key={`${listVariant}-mat-${group.material.id}`}
            group={group}
            variant={variant}
            ordered={listVariant === 'ordered'}
            onOrder={async () => {
              await markMaterialLotsOrdered(group.lots, group.material.id!)
              await refresh()
            }}
            onUnorder={async () => {
              await unmarkMaterialLotsOrdered(group.lots)
              await refresh()
            }}
            onReplace={() =>
              setDialog({ material: group.material, lots: group.lots, soon: variant === 'soon' })
            }
          />
        ))}
      </div>
      {dialog && (
        <MaterialExpiredDialog
          material={dialog.material}
          lots={dialog.lots}
          soon={dialog.soon}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}

function MaterialRefillDialog({
  item,
  onClose,
}: {
  item: MaterialRefillItemWithName
  onClose: () => void
}) {
  const refresh = useStore((s) => s.refresh)
  const materials = useStore((s) => s.materials)
  const mat = materials.find((m) => m.id === item.material_id)
  const [addToStock, setAddToStock] = useState(true)
  const [qtyInput, setQtyInput] = useState(String(item.amount_needed))
  const [expiry, setExpiry] = useState('')
  const [variantLabel, setVariantLabel] = useState('')
  const [loading, setLoading] = useState(false)

  const needsExpiry = mat?.mode === 'simple' || mat?.mode === 'variant'
  const isVariant = mat?.mode === 'variant'

  async function handleConfirm() {
    if (addToStock) {
      if (needsExpiry && !expiry) return
      if (isVariant && !variantLabel) return
    }
    setLoading(true)
    try {
      if (addToStock && mat) {
        await addOrUpdateMaterialLot(
          mat.id!,
          needsExpiry ? expiry : undefined,
          isVariant ? variantLabel : undefined,
          parseQuantityInput(qtyInput) ?? 1,
        )
      }
      await removeMaterialRefillItem(item.id!)
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Material aufgefüllt?">
      <div className="space-y-4">
        <p className="font-medium text-gray-900">{item.material_name}</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={addToStock}
            onChange={(e) => setAddToStock(e.target.checked)}
            className="w-5 h-5 rounded accent-brand-navy"
          />
          <span className="text-sm font-medium">Bestand erhöhen</span>
        </label>
        {addToStock && mat && (
          <>
            {isVariant && mat.variant_preset && (
              <MaterialVariantPicker
                preset={mat.variant_preset}
                value={variantLabel}
                onChange={setVariantLabel}
                required
              />
            )}
            {needsExpiry && (
              <MonthPicker value={expiry} onChange={setExpiry} label="Ablaufmonat" required />
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Menge</label>
              <input
                type="number"
                min={1}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onBlur={() => setQtyInput((v) => normalizeQuantityInput(v))}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
            </div>
          </>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl">
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              loading ||
              (addToStock && needsExpiry && !expiry) ||
              (addToStock && isVariant && !variantLabel)
            }
            className="flex-1 py-3 bg-brand-navy text-white font-semibold rounded-xl disabled:bg-gray-200"
          >
            {loading ? '…' : 'Bestätigen'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function MaterialExpiredDialog({
  material,
  lots,
  soon,
  onClose,
}: {
  material: Material
  lots: MaterialLot[]
  soon: boolean
  onClose: () => void
}) {
  const refresh = useStore((s) => s.refresh)
  const [addToStock, setAddToStock] = useState(true)
  const total = lots.reduce((s, l) => s + l.quantity, 0)
  const [qtyInput, setQtyInput] = useState(String(total))
  const [expiry, setExpiry] = useState('')
  const [variantLabel, setVariantLabel] = useState(lots[0]?.variant_label ?? '')
  const [loading, setLoading] = useState(false)
  const isVariant = material.mode === 'variant'

  async function handleConfirm() {
    if (addToStock) {
      if (!expiry) return
      if (isVariant && !variantLabel) return
    }
    setLoading(true)
    try {
      for (const lot of lots) {
        if (lot.id) await deleteMaterialLot(lot.id)
      }
      if (addToStock) {
        await addOrUpdateMaterialLot(
          material.id!,
          expiry,
          isVariant ? variantLabel : undefined,
          parseQuantityInput(qtyInput) ?? 1,
        )
      }
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={soon ? 'Bald ablaufendes Material ersetzen' : 'Abgelaufenes Material ersetzen'}
    >
      <div className="space-y-4">
        <p className="font-medium text-gray-900">{material.name}</p>
        <div className={`rounded-xl p-3 ${soon ? 'bg-yellow-50' : 'bg-red-50'}`}>
          {lots.map((b) => (
            <p key={b.id} className={`text-sm font-mono ${soon ? 'text-yellow-900' : 'text-red-700'}`}>
              {formatLotLabel(b)} · {b.quantity}×
            </p>
          ))}
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={addToStock}
            onChange={(e) => setAddToStock(e.target.checked)}
            className="w-5 h-5 rounded accent-brand-navy"
          />
          <span className="text-sm font-medium">Neuen Bestand hinzufügen</span>
        </label>
        {addToStock && (
          <>
            {isVariant && material.variant_preset && (
              <MaterialVariantPicker
                preset={material.variant_preset}
                value={variantLabel}
                onChange={setVariantLabel}
                required
              />
            )}
            <MonthPicker value={expiry} onChange={setExpiry} label="Neuer Ablaufmonat" required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Menge</label>
              <input
                type="number"
                min={1}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onBlur={() => setQtyInput((v) => normalizeQuantityInput(v))}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
            </div>
          </>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl">
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              loading || (addToStock && !expiry) || (addToStock && isVariant && !variantLabel)
            }
            className="flex-1 py-3 bg-brand-navy text-white font-semibold rounded-xl disabled:bg-gray-200"
          >
            {loading ? '…' : 'Bestätigen'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
