import { useState } from 'react'
import { useStore, getOrderedBatchIds, getOrderedRefillIds, isBatchGroupOrdered } from '../hooks/useStore'
import type { RefillItemWithName, MedicationBatch } from '../types'
import {
  removeRefillItem,
  addOrUpdateBatch,
  deleteBatch,
  markBatchesOrdered,
  unmarkBatchesOrdered,
  markRefillOrdered,
  unmarkRefillOrdered,
} from '../db/queries'
import { formatYearMonth, expiryColorClass } from '../utils/expiry'
import Modal from '../components/Modal'
import MonthPicker from '../components/MonthPicker'
import MedicationNameDisplay from '../components/MedicationNameDisplay'
import type { Medication } from '../types'
import { normalizeQuantityInput, parseQuantityInput } from '../utils/quantityInput'

export default function RefillPage() {
  const { refillItems, expiredGroups, expiringSoonGroups, orderMarkers, refresh } = useStore()
  const orderedBatchIds = getOrderedBatchIds(orderMarkers)
  const orderedRefillIds = getOrderedRefillIds(orderMarkers)
  const [activeTab, setActiveTab] = useState<'verbraucht' | 'abgelaufen'>('verbraucht')
  const [refillDialog, setRefillDialog] = useState<RefillItemWithName | null>(null)
  const [expiredDialog, setExpiredDialog] = useState<{
    medication: Medication
    batches: MedicationBatch[]
    soon: boolean
  } | null>(null)

  const expiryCount = expiredGroups.length + expiringSoonGroups.length

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-0 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Nachfüllen</h1>
        <div className="flex gap-0">
          {(['verbraucht', 'abgelaufen'] as const).map((tab) => {
            const count = tab === 'verbraucht' ? refillItems.length : expiryCount
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab === 'verbraucht' ? 'Verbraucht' : 'Ablauf'}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === 'verbraucht' && (
          <VerbrauchtSection
            items={refillItems}
            orderedRefillIds={orderedRefillIds}
            onOrder={async (item) => {
              await markRefillOrdered(item.id!, item.medication_id)
              await refresh()
            }}
            onUnorder={async (item) => {
              await unmarkRefillOrdered(item.id!)
              await refresh()
            }}
            onRefill={setRefillDialog}
          />
        )}
        {activeTab === 'abgelaufen' && (
          <AbgelaufenSection
            expiredGroups={expiredGroups}
            expiringSoonGroups={expiringSoonGroups}
            orderedBatchIds={orderedBatchIds}
            onOrder={async (g) => {
              await markBatchesOrdered(g.batches, g.medication.id!)
              await refresh()
            }}
            onUnorder={async (g) => {
              await unmarkBatchesOrdered(g.batches)
              await refresh()
            }}
            onReplace={(g, soon) =>
              setExpiredDialog({ medication: g.medication, batches: g.batches, soon })
            }
          />
        )}
      </div>

      {refillDialog && (
        <RefillDialog
          item={refillDialog}
          onClose={() => setRefillDialog(null)}
          onDone={async (addToStock, qty, expiry) => {
            if (addToStock && expiry) {
              await addOrUpdateBatch(refillDialog.medication_id, expiry, qty)
            }
            await removeRefillItem(refillDialog.id!)
            await refresh()
            setRefillDialog(null)
          }}
        />
      )}

      {expiredDialog && (
        <ExpiredDialog
          medication={expiredDialog.medication}
          expiredBatches={expiredDialog.batches}
          soon={expiredDialog.soon}
          onClose={() => setExpiredDialog(null)}
          onDone={async (addToStock, qty, expiry, batchIdsToRemove) => {
            for (const id of batchIdsToRemove) {
              await deleteBatch(id)
            }
            if (addToStock && expiry) {
              await addOrUpdateBatch(expiredDialog.medication.id!, expiry, qty)
            }
            await refresh()
            setExpiredDialog(null)
          }}
        />
      )}
    </div>
  )
}

// ──────────── Verbraucht Section ────────────

function splitRefillItems(items: RefillItemWithName[], orderedRefillIds: Set<number>) {
  const pending: RefillItemWithName[] = []
  const ordered: RefillItemWithName[] = []
  for (const item of items) {
    if (item.id != null && orderedRefillIds.has(item.id)) ordered.push(item)
    else pending.push(item)
  }
  return { pending, ordered }
}

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
          className="text-xs text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-100"
        >
          Bestellt zurücknehmen
        </button>
      ) : (
        <button
          type="button"
          onClick={onOrder}
          className="border border-blue-600 text-blue-700 hover:bg-blue-50 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          Bestellt
        </button>
      )}
      <button
        type="button"
        onClick={onDone}
        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
      >
        {doneLabel}
      </button>
    </div>
  )
}

function VerbrauchtCard({
  item,
  ordered,
  onOrder,
  onUnorder,
  onRefill,
}: {
  item: RefillItemWithName
  ordered: boolean
  onOrder: () => void
  onUnorder: () => void
  onRefill: () => void
}) {
  return (
    <div
      className={`rounded-2xl border shadow-sm p-4 ${
        ordered ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          {ordered && (
            <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mb-1">
              Bestellt
            </span>
          )}
          <p className="font-semibold text-gray-900">{item.medication_name}</p>
          {item.medication_secondary && (
            <p className="text-xs text-gray-500">{item.medication_secondary}</p>
          )}
          <p className="text-sm text-gray-500 mt-0.5">Benötigt: {item.amount_needed}×</p>
          {ordered && (
            <p className="text-xs text-blue-700 mt-1">Bereit zum Ein sortieren</p>
          )}
        </div>
        <RefillActionButtons
          ordered={ordered}
          onOrder={onOrder}
          onUnorder={onUnorder}
          onDone={onRefill}
          doneLabel="Aufgefüllt"
        />
      </div>
    </div>
  )
}

function VerbrauchtSection({
  items,
  orderedRefillIds,
  onOrder,
  onUnorder,
  onRefill,
}: {
  items: RefillItemWithName[]
  orderedRefillIds: Set<number>
  onOrder: (item: RefillItemWithName) => void
  onUnorder: (item: RefillItemWithName) => void
  onRefill: (item: RefillItemWithName) => void
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-medium text-gray-500">Alles aufgefüllt</p>
        <p className="text-sm mt-1">Hier erscheinen verbrauchte Medikamente</p>
      </div>
    )
  }

  const { pending, ordered } = splitRefillItems(items, orderedRefillIds)

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Zu besorgen</h2>
          <div className="space-y-3">
            {pending.map((item) => (
              <VerbrauchtCard
                key={item.id}
                item={item}
                ordered={false}
                onOrder={() => onOrder(item)}
                onUnorder={() => onUnorder(item)}
                onRefill={() => onRefill(item)}
              />
            ))}
          </div>
        </section>
      )}
      {ordered.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-blue-700 mb-3">Bestellt</h2>
          <p className="text-xs text-gray-500 mb-3">Lieferung da — zum Ein sortieren mit „Aufgefüllt“ bestätigen</p>
          <div className="space-y-3">
            {ordered.map((item) => (
              <VerbrauchtCard
                key={item.id}
                item={item}
                ordered
                onOrder={() => onOrder(item)}
                onUnorder={() => onUnorder(item)}
                onRefill={() => onRefill(item)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ──────────── Ablauf Section ────────────

type ExpiryGroup = { medication: Medication; batches: MedicationBatch[] }

function splitExpiryGroups(groups: ExpiryGroup[], orderedBatchIds: Set<number>) {
  const pending: ExpiryGroup[] = []
  const ordered: ExpiryGroup[] = []
  for (const group of groups) {
    if (isBatchGroupOrdered(group.batches, orderedBatchIds)) ordered.push(group)
    else pending.push(group)
  }
  return { pending, ordered }
}

function ExpiryCard({
  group,
  variant,
  ordered,
  onOrder,
  onUnorder,
  onReplace,
}: {
  group: ExpiryGroup
  variant: 'expired' | 'soon'
  ordered: boolean
  onOrder: () => void
  onUnorder: () => void
  onReplace: () => void
}) {
  const { medication, batches } = group
  const isExpired = variant === 'expired'

  const baseStyle = ordered
    ? 'bg-blue-50 border-blue-200'
    : isExpired
      ? 'bg-red-50 border-red-200'
      : 'bg-yellow-50 border-yellow-200'

  return (
    <div className={`rounded-2xl border shadow-sm p-4 ${baseStyle}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {ordered && (
            <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full mb-1">
              Bestellt
            </span>
          )}
          <MedicationNameDisplay
            med={medication}
            primaryClassName={`font-semibold ${
              ordered ? 'text-blue-900' : isExpired ? 'text-red-900' : 'text-yellow-900'
            }`}
            secondaryClassName={`text-xs truncate mt-0.5 ${
              ordered ? 'text-blue-800/80' : isExpired ? 'text-red-700/80' : 'text-yellow-800/80'
            }`}
          />
          <div className="mt-1 space-y-0.5">
            {batches.map((b) => (
              <p key={b.id} className={`text-sm font-mono ${expiryColorClass(b.expiry_date)}`}>
                {b.quantity}× {formatYearMonth(b.expiry_date)}
              </p>
            ))}
          </div>
          {ordered && (
            <p className="text-xs text-blue-700 mt-1">Bereit zum Ein sortieren</p>
          )}
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

function ExpiryGroupList({
  groups,
  variant,
  orderedBatchIds,
  onOrder,
  onUnorder,
  onReplace,
}: {
  groups: ExpiryGroup[]
  variant: 'expired' | 'soon'
  orderedBatchIds: Set<number>
  onOrder: (g: ExpiryGroup) => void
  onUnorder: (g: ExpiryGroup) => void
  onReplace: (g: ExpiryGroup) => void
}) {
  const { pending, ordered } = splitExpiryGroups(groups, orderedBatchIds)
  if (!pending.length && !ordered.length) return null

  return (
    <>
      {pending.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Zu besorgen</h3>
          <div className="space-y-3">
            {pending.map((group) => (
              <ExpiryCard
                key={`pending-${group.medication.id}`}
                group={group}
                variant={variant}
                ordered={false}
                onOrder={() => onOrder(group)}
                onUnorder={() => onUnorder(group)}
                onReplace={() => onReplace(group)}
              />
            ))}
          </div>
        </div>
      )}
      {ordered.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Bestellt</h3>
          <p className="text-xs text-gray-500 mb-2">Lieferung da — mit „Ersetzt“ ein sortieren</p>
          <div className="space-y-3">
            {ordered.map((group) => (
              <ExpiryCard
                key={`ordered-${group.medication.id}`}
                group={group}
                variant={variant}
                ordered
                onOrder={() => onOrder(group)}
                onUnorder={() => onUnorder(group)}
                onReplace={() => onReplace(group)}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function AbgelaufenSection({
  expiredGroups,
  expiringSoonGroups,
  orderedBatchIds,
  onOrder,
  onUnorder,
  onReplace,
}: {
  expiredGroups: ExpiryGroup[]
  expiringSoonGroups: ExpiryGroup[]
  orderedBatchIds: Set<number>
  onOrder: (g: ExpiryGroup) => void
  onUnorder: (g: ExpiryGroup) => void
  onReplace: (g: ExpiryGroup, soon: boolean) => void
}) {
  if (expiredGroups.length === 0 && expiringSoonGroups.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="font-medium text-gray-500">Keine ablaufenden Chargen</p>
        <p className="text-sm mt-1">Alle Medikamente sind noch lange gültig</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {expiredGroups.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-600 mb-3">Abgelaufen</h2>
          <ExpiryGroupList
            groups={expiredGroups}
            variant="expired"
            orderedBatchIds={orderedBatchIds}
            onOrder={onOrder}
            onUnorder={onUnorder}
            onReplace={(g) => onReplace(g, false)}
          />
        </section>
      )}

      {expiringSoonGroups.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-yellow-600 mb-3">Bald ablaufend</h2>
          <p className="text-xs text-gray-500 mb-3">Läuft in den nächsten 3 Monaten ab</p>
          <ExpiryGroupList
            groups={expiringSoonGroups}
            variant="soon"
            orderedBatchIds={orderedBatchIds}
            onOrder={onOrder}
            onUnorder={onUnorder}
            onReplace={(g) => onReplace(g, true)}
          />
        </section>
      )}
    </div>
  )
}

// ──────────── Dialoge ────────────

function RefillDialog({
  item,
  onClose,
  onDone,
}: {
  item: RefillItemWithName
  onClose: () => void
  onDone: (addToStock: boolean, qty: number, expiry: string) => Promise<void>
}) {
  const [addToStock, setAddToStock] = useState(true)
  const [qtyInput, setQtyInput] = useState(String(item.amount_needed))
  const [expiry, setExpiry] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (addToStock && !expiry) return
    setLoading(true)
    try {
      await onDone(addToStock, parseQuantityInput(qtyInput) ?? 1, expiry)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Aufgefüllt?">
      <div className="space-y-4">
        <div>
          <p className="text-gray-700 font-medium">{item.medication_name}</p>
          {item.medication_secondary && (
            <p className="text-xs text-gray-500">{item.medication_secondary}</p>
          )}
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={addToStock}
            onChange={(e) => setAddToStock(e.target.checked)}
            className="w-5 h-5 rounded accent-red-600"
          />
          <span className="text-sm font-medium">Bestand im Inventar erhöhen</span>
        </label>
        {addToStock && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Menge</label>
              <input
                type="number"
                min={1}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onBlur={() => setQtyInput((v) => normalizeQuantityInput(v))}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <MonthPicker value={expiry} onChange={setExpiry} label="Ablaufmonat neuer Charge" required />
          </>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700">
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (addToStock && !expiry)}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl"
          >
            {loading ? '…' : 'Bestätigen'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ExpiredDialog({
  medication,
  expiredBatches,
  soon,
  onClose,
  onDone,
}: {
  medication: Medication
  expiredBatches: MedicationBatch[]
  soon: boolean
  onClose: () => void
  onDone: (addToStock: boolean, qty: number, expiry: string, batchIdsToRemove: number[]) => Promise<void>
}) {
  const [addToStock, setAddToStock] = useState(true)
  const totalExpired = expiredBatches.reduce((s, b) => s + b.quantity, 0)
  const [qtyInput, setQtyInput] = useState(String(totalExpired))
  const [expiry, setExpiry] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (addToStock && !expiry) return
    setLoading(true)
    try {
      await onDone(addToStock, parseQuantityInput(qtyInput) ?? 1, expiry, expiredBatches.map((b) => b.id!))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={soon ? 'Bald ablaufende Charge ersetzen' : 'Abgelaufene Charge ersetzen'}>
      <div className="space-y-4">
        <MedicationNameDisplay med={medication} primaryClassName="text-gray-700 font-medium" />
        <div className={`rounded-xl p-3 ${soon ? 'bg-yellow-50' : 'bg-red-50'}`}>
          {expiredBatches.map((b) => (
            <p key={b.id} className={`text-sm font-mono ${soon ? 'text-yellow-900' : 'text-red-700'}`}>
              {b.quantity}× {formatYearMonth(b.expiry_date)} – {soon ? 'läuft bald ab' : 'abgelaufen'}
            </p>
          ))}
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={addToStock}
            onChange={(e) => setAddToStock(e.target.checked)}
            className="w-5 h-5 rounded accent-red-600"
          />
          <span className="text-sm font-medium">Neue Charge zum Bestand hinzufügen</span>
        </label>
        {addToStock && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Menge neue Charge</label>
              <input
                type="number"
                min={1}
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onBlur={() => setQtyInput((v) => normalizeQuantityInput(v))}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <MonthPicker value={expiry} onChange={setExpiry} label="Neuer Ablaufmonat" required />
          </>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700">
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (addToStock && !expiry)}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl"
          >
            {loading ? '…' : 'Bestätigen'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
