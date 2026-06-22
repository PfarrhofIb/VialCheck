import type { Medication, MedicationBatch, RefillItem, OrderMarker } from './index'

export const BACKUP_VERSION = 1

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
}
