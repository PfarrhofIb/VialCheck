export type DisplayNameField = 'handelsname' | 'wirkstoffname'

export interface Medication {
  id?: number
  barcode: string
  handelsname: string
  wirkstoffname: string
  display_name: DisplayNameField
  photo_blob_id?: string
  storage_location?: string
  ml_per_ampule?: number
  mg_per_ml?: number
}

export interface MedicationBatch {
  id?: number
  medication_id: number
  expiry_date: string  // yyyy-MM
  quantity: number
}

export interface RefillItem {
  id?: number
  medication_id: number
  amount_needed: number
}

/** Nachfüllen: als bestellt markiert, noch nicht eingesortiert */
export type OrderTargetType = 'batch' | 'refill'

export interface OrderMarker {
  id?: number
  target_type: OrderTargetType
  target_id: number
  medication_id: number
  ordered_at: string
}

export interface Photo {
  id?: string
  blob: Blob
}

/** Aufgelöste Ansicht: Medikament + alle Chargen */
export interface MedicationWithBatches extends Medication {
  batches: MedicationBatch[]
  totalQuantity: number
}

/** Nachfüllen-Tab: verbrauchte Einträge angereichert */
export interface RefillItemWithName extends RefillItem {
  medication_name: string
  medication_secondary: string | null
  barcode: string
}
