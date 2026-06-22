import { create } from 'zustand'
import type { MedicationWithBatches, RefillItemWithName, OrderMarker } from '../types'
import {
  getAllMedications,
  getRefillList,
  getExpiredBatches,
  getExpiringSoonBatches,
  getOrderMarkers,
  type MedicationExpiryGroup,
} from '../db/queries'

interface StoreState {
  medications: MedicationWithBatches[]
  refillItems: RefillItemWithName[]
  expiredGroups: MedicationExpiryGroup[]
  expiringSoonGroups: MedicationExpiryGroup[]
  orderMarkers: OrderMarker[]
  loading: boolean
  refresh: () => Promise<void>
}

export const useStore = create<StoreState>((set) => ({
  medications: [],
  refillItems: [],
  expiredGroups: [],
  expiringSoonGroups: [],
  orderMarkers: [],
  loading: false,

  refresh: async () => {
    set({ loading: true })
    const [medications, refillItems, expiredGroups, expiringSoonGroups, orderMarkers] = await Promise.all([
      getAllMedications(),
      getRefillList(),
      getExpiredBatches(),
      getExpiringSoonBatches(),
      getOrderMarkers(),
    ])
    set({ medications, refillItems, expiredGroups, expiringSoonGroups, orderMarkers, loading: false })
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

export function isBatchGroupOrdered(
  batches: { id?: number }[],
  orderedBatchIds: Set<number>,
): boolean {
  const withId = batches.filter((b) => b.id != null)
  return withId.length > 0 && withId.every((b) => orderedBatchIds.has(b.id!))
}
