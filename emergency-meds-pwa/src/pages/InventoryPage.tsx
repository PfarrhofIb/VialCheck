import { useCallback, useState } from 'react'
import { useStore } from '../hooks/useStore'
import type { MedicationWithBatches } from '../types'
import MedicationCard from '../components/MedicationCard'
import ConsumeSheet from '../components/ConsumeSheet'
import AddBatchSheet from '../components/AddBatchSheet'
import EditMedicationModal from '../components/EditMedicationModal'
import AddMedicationSheet from '../components/AddMedicationSheet'
import BackupSheet from '../components/BackupSheet'
import BarcodeScannerSheet from '../components/BarcodeScannerSheet'
import ScannedMedicationSheet from '../components/ScannedMedicationSheet'
import { findMedicationByScan } from '../db/queries'
import { parseGS1, preferredBarcode } from '../utils/barcode'
import { getPrimaryName, medicationMatchesSearch } from '../utils/medicationDisplay'

export default function InventoryPage() {
  const { medications, loading, refresh } = useStore()
  const [consumeMed, setConsumeMed] = useState<MedicationWithBatches | null>(null)
  const [addBatchMed, setAddBatchMed] = useState<MedicationWithBatches | null>(null)
  const [addBatchExpiry, setAddBatchExpiry] = useState('')
  const [addBatchQty, setAddBatchQty] = useState(1)
  const [editMed, setEditMed] = useState<MedicationWithBatches | null>(null)
  const [addSheet, setAddSheet] = useState<{
    open: boolean
    barcode?: string
    expiry?: string
  }>({ open: false })
  const [showBackup, setShowBackup] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedMed, setScannedMed] = useState<MedicationWithBatches | null>(null)
  const [scannedExpiry, setScannedExpiry] = useState<string | undefined>()
  const [search, setSearch] = useState('')

  const filtered = medications
    .filter((m) => medicationMatchesSearch(m, search))
    .sort((a, b) =>
      getPrimaryName(a).localeCompare(getPrimaryName(b), 'de', { sensitivity: 'base' }),
    )

  const handleScan = useCallback(async (raw: string) => {
    setShowScanner(false)
    const parsed = parseGS1(raw)
    const med = await findMedicationByScan(raw)
    if (med) {
      setScannedExpiry(parsed.expiryDate)
      setScannedMed(med)
    } else {
      setAddSheet({
        open: true,
        barcode: preferredBarcode(raw),
        expiry: parsed.expiryDate,
      })
    }
  }, [])

  function openAddBatch(
    med: MedicationWithBatches,
    expiry?: string,
    qty = 1,
  ) {
    setScannedMed(null)
    setAddBatchMed(med)
    setAddBatchExpiry(expiry ?? '')
    setAddBatchQty(qty)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 pr-14 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Medikamente</h1>
          <div className="flex items-center gap-1 mr-10">
            <button
              onClick={() => setShowScanner(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Barcode scannen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m10 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
            <button
              onClick={() => setShowBackup(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Datensicherung"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </button>
            <button
              onClick={refresh}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              aria-label="Aktualisieren"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Medikament suchen…"
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
        />
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="text-center text-gray-400 py-12">Lade…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium text-gray-500">Kein Bestand vorhanden</p>
            <p className="text-sm mt-1">Tippe auf „+" um Medikamente hinzuzufügen</p>
          </div>
        )}
        {filtered.map((med) => (
          <MedicationCard
            key={med.id}
            med={med}
            onConsume={setConsumeMed}
            onEdit={setEditMed}
            onAddBatch={(m) => openAddBatch(m)}
          />
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddSheet({ open: true })}
        className="fixed right-4 bottom-20 w-14 h-14 bg-brand-navy hover:bg-brand-navy-dark text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors z-40"
        aria-label="Medikament hinzufügen"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        +
      </button>

      {/* Sheets & Modals */}
      <ConsumeSheet med={consumeMed} onClose={() => setConsumeMed(null)} />
      <AddBatchSheet
        med={addBatchMed}
        initialExpiry={addBatchExpiry}
        initialQty={addBatchQty}
        onClose={() => {
          setAddBatchMed(null)
          setAddBatchExpiry('')
          setAddBatchQty(1)
        }}
      />
      <EditMedicationModal med={editMed} onClose={() => setEditMed(null)} />
      <AddMedicationSheet
        open={addSheet.open}
        initialBarcode={addSheet.barcode}
        initialExpiry={addSheet.expiry ?? ''}
        onClose={() => setAddSheet({ open: false })}
      />
      <BackupSheet open={showBackup} onClose={() => setShowBackup(false)} />
      <BarcodeScannerSheet
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />
      <ScannedMedicationSheet
        med={scannedMed}
        scannedExpiry={scannedExpiry}
        onClose={() => {
          setScannedMed(null)
          setScannedExpiry(undefined)
        }}
        onOpenAddBatch={openAddBatch}
      />
    </div>
  )
}
