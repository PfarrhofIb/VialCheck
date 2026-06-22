import Dexie, { type Table } from 'dexie'
import type { Medication, MedicationBatch, RefillItem, Photo, OrderMarker } from '../types'

class EmergencyMedsDB extends Dexie {
  medications!: Table<Medication, number>
  medication_batches!: Table<MedicationBatch, number>
  refill_list!: Table<RefillItem, number>
  photos!: Table<Photo, string>
  order_markers!: Table<OrderMarker, number>

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
  }
}

export const db = new EmergencyMedsDB()
