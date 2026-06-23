import type { Medication, MedicationBatch, RefillItem, OrderMarker } from './index'
import type {
  Material,
  MaterialLot,
  MaterialRefillItem,
  MaterialOrderMarker,
} from './material'

export const BACKUP_VERSION = 2

export interface BackupPhoto {
  id: string
  data: string
  mimeType: string
}

export interface BackupFile {
  version: number
  exportedAt: string
  medications: Medication[]
  medication_batches: MedicationBatch[]
  refill_list: RefillItem[]
  photos: BackupPhoto[]
  order_markers?: OrderMarker[]
  materials?: Material[]
  material_lots?: MaterialLot[]
  material_refill_list?: MaterialRefillItem[]
  material_order_markers?: MaterialOrderMarker[]
}
