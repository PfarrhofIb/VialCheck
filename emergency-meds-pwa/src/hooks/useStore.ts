import { create } from 'zustand'
import type { MedicationWithBatches, RefillItemWithName, OrderMarker } from '../types'
import type { MaterialWithLots, MaterialRefillItemWithName, MaterialOrderMarker } from '../types/material'
import {
  getAllMedications,
  getRefillList,
  getExpiredBatches,
  getExpiringSoonBatches,
  getOrderMarkers,
  type MedicationExpiryGroup,
} from '../db/queries'
import {
  getAllMaterials,
  getExpiredMaterialLots,
  getExpiringSoonMaterialLots,
  getMaterialRefillList,
  getMaterialOrderMarkers,
  type MaterialExpiryGroup,
} from '../db/materialQueries'

interface StoreState {
  medications: MedicationWithBatches[]
  materials: MaterialWithLots[]
  refillItems: RefillItemWithName[]
  materialRefillItems: MaterialRefillItemWithName[]
  expiredGroups: MedicationExpiryGroup[]
  expiringSoonGroups: MedicationExpiryGroup[]
  expiredMaterialGroups: MaterialExpiryGroup[]
  expiringSoonMaterialGroups: MaterialExpiryGroup[]
  orderMarkers: OrderMarker[]
  materialOrderMarkers: MaterialOrderMarker[]
  loading: boolean
  refresh: () => Promise<void>
}

export const useStore = create<StoreState>((set) => ({
  medications: [],
  materials: [],
  refillItems: [],
  materialRefillItems: [],
  expiredGroups: [],
  expiringSoonGroups: [],
  expiredMaterialGroups: [],
  expiringSoonMaterialGroups: [],
  orderMarkers: [],
  materialOrderMarkers: [],
  loading: false,

  refresh: async () => {
    set({ loading: true })
    const [
      medications,
      materials,
      refillItems,
      materialRefillItems,
      expiredGroups,
      expiringSoonGroups,
      expiredMaterialGroups,
      expiringSoonMaterialGroups,
      orderMarkers,
      materialOrderMarkers,
    ] = await Promise.all([
      getAllMedications(),
      getAllMaterials(),
      getRefillList(),
      getMaterialRefillList(),
      getExpiredBatches(),
      getExpiringSoonBatches(),
      getExpiredMaterialLots(),
      getExpiringSoonMaterialLots(),
      getOrderMarkers(),
      getMaterialOrderMarkers(),
    ])
    set({
      medications,
      materials,
      refillItems,
      materialRefillItems,
      expiredGroups,
      expiringSoonGroups,
      expiredMaterialGroups,
      expiringSoonMaterialGroups,
      orderMarkers,
      materialOrderMarkers,
      loading: false,
    })
  },
}))

export function getOrderedBatchIds(markers: OrderMarker[]): Set<number> {
  return new Set(
    markers.filter((m) => m.target_type === 'batch').map((m) => m.target_id),
  )
}

export function getOrderedRefillIds(markers: OrderMarker[]): Set<number> {
  return new Set(
    markers.filter((m) => m.target_type === 'refill').map((m) => m.target_id),
  )
}

export function getOrderedMaterialLotIds(markers: MaterialOrderMarker[]): Set<number> {
  return new Set(
    markers.filter((m) => m.target_type === 'material_lot').map((m) => m.target_id),
  )
}

export function getOrderedMaterialRefillIds(markers: MaterialOrderMarker[]): Set<number> {
  return new Set(
    markers.filter((m) => m.target_type === 'material_refill').map((m) => m.target_id),
  )
}

export function isBatchGroupOrdered(
  batches: { id?: number }[],
  orderedBatchIds: Set<number>,
): boolean {
  const withId = batches.filter((b) => b.id != null)
  return withId.length > 0 && withId.every((b) => orderedBatchIds.has(b.id!))
}
