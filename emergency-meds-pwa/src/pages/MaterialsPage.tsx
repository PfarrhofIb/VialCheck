import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import type { MaterialWithLots } from '../types/material'
import MaterialCard from '../components/MaterialCard'
import AddMaterialSheet from '../components/AddMaterialSheet'
import AddMaterialLotSheet from '../components/AddMaterialLotSheet'
import ConsumeMaterialSheet from '../components/ConsumeMaterialSheet'
import EditMaterialModal from '../components/EditMaterialModal'
import { materialMatchesSearch } from '../utils/materialDisplay'

export default function MaterialsPage() {
  const { materials, loading, refresh } = useStore()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [consumeMat, setConsumeMat] = useState<MaterialWithLots | null>(null)
  const [addLotMat, setAddLotMat] = useState<MaterialWithLots | null>(null)
  const [editMat, setEditMat] = useState<MaterialWithLots | null>(null)

  const filtered = materials
    .filter((m) => materialMatchesSearch(m, search))
    .sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 pr-14 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Material</h1>
          <button
            type="button"
            onClick={() => refresh()}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 mr-10"
            aria-label="Aktualisieren"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Material suchen…"
          className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && <div className="text-center text-gray-400 py-12">Lade…</div>}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="font-medium text-gray-500">Kein Material erfasst</p>
            <p className="text-sm mt-1">Tippe auf „+" um Material hinzuzufügen</p>
          </div>
        )}
        {filtered.map((mat) => (
          <MaterialCard
            key={mat.id}
            material={mat}
            onConsume={setConsumeMat}
            onEdit={setEditMat}
            onAddLot={setAddLotMat}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowAdd(true)}
        className="fixed right-4 bottom-20 w-14 h-14 bg-brand-navy hover:bg-brand-navy-dark text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-colors z-40"
        aria-label="Material hinzufügen"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        +
      </button>

      <AddMaterialSheet open={showAdd} onClose={() => setShowAdd(false)} />
      <AddMaterialLotSheet material={addLotMat} onClose={() => setAddLotMat(null)} />
      <ConsumeMaterialSheet material={consumeMat} onClose={() => setConsumeMat(null)} />
      <EditMaterialModal material={editMat} onClose={() => setEditMat(null)} />
    </div>
  )
}
