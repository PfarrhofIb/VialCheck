export type MaterialMode = 'simple' | 'variant' | 'no_expiry'

export type VariantPreset = 'tubus_mm' | 'venflon'

export interface Material {
  id?: number
  name: string
  mode: MaterialMode
  variant_preset?: VariantPreset
  notes?: string
  photo_blob_id?: string
}

export interface MaterialLot {
  id?: number
  material_id: number
  variant_label?: string
  expiry_date?: string
  quantity: number
}

export interface MaterialWithLots extends Material {
  lots: MaterialLot[]
  totalQuantity: number
}

export interface MaterialRefillItem {
  id?: number
  material_id: number
  amount_needed: number
}

export type MaterialOrderTargetType = 'material_lot' | 'material_refill'

export interface MaterialOrderMarker {
  id?: number
  target_type: MaterialOrderTargetType
  target_id: number
  material_id: number
  ordered_at: string
}

export interface MaterialRefillItemWithName extends MaterialRefillItem {
  material_name: string
}
