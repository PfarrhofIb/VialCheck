import Dexie, { type Table } from 'dexie'
import type { Medication, MedicationBatch, RefillItem, Photo, OrderMarker } from '../types'
import type { Material, MaterialLot, MaterialRefillItem, MaterialOrderMarker } from '../types/material'

class EmergencyMedsDB extends Dexie {
  medications!: Table<Medication, number>
  medication_batches!: Table<MedicationBatch, number>
  refill_list!: Table<RefillItem, number>
  photos!: Table<Photo, string>
  order_markers!: Table<OrderMarker, number>
  materials!: Table<Material, number>
  material_lots!: Table<MaterialLot, number>
  material_refill_list!: Table<MaterialRefillItem, number>
  material_order_markers!: Table<MaterialOrderMarker, number>

  constructor() {
    super('emergency-meds')
    this.version(1).stores({
      medications: '++id, &barcode, name',
      medication_batches: '++id, medication_id, [medication_id+expiry_date]',
      refill_list: '++id, medication_id',
      photos: 'id',
    })
    this.version(2).stores({
      medications: '++id, &barcode, handelsname, wirkstoffname',
      medication_batches: '++id, medication_id, [medication_id+expiry_date]',
      refill_list: '++id, medication_id',
      photos: 'id',
    }).upgrade(async (tx) => {
      const meds = await tx.table('medications').toArray() as Array<Record<string, unknown>>
      for (const med of meds) {
        if (med.handelsname !== undefined) continue
        const legacyName = typeof med.name === 'string' ? med.name : ''
        await tx.table('medications').update(med.id as number, {
          handelsname: legacyName,
          wirkstoffname: '',
          display_name: 'handelsname',
        })
      }
    })
    this.version(3).stores({
      medications: '++id, &barcode, handelsname, wirkstoffname',
      medication_batches: '++id, medication_id, [medication_id+expiry_date]',
      refill_list: '++id, medication_id',
      photos: 'id',
      order_markers: '++id, &[target_type+target_id], medication_id, target_type',
    })
    this.version(4).stores({
      medications: '++id, &barcode, handelsname, wirkstoffname',
      medication_batches: '++id, medication_id, [medication_id+expiry_date]',
      refill_list: '++id, medication_id',
      photos: 'id',
      order_markers: '++id, &[target_type+target_id], medication_id, target_type',
      materials: '++id, name, mode',
      material_lots: '++id, material_id, expiry_date',
    })
    this.version(5).stores({
      medications: '++id, &barcode, handelsname, wirkstoffname',
      medication_batches: '++id, medication_id, [medication_id+expiry_date]',
      refill_list: '++id, medication_id',
      photos: 'id',
      order_markers: '++id, &[target_type+target_id], medication_id, target_type',
      materials: '++id, name, mode',
      material_lots: '++id, material_id, expiry_date',
      material_refill_list: '++id, material_id',
      material_order_markers: '++id, &[target_type+target_id], material_id, target_type',
    })
  }
}

export const db = new EmergencyMedsDB()
