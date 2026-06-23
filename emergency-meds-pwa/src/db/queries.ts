import { db } from './schema'
import type { Medication, MedicationBatch, MedicationWithBatches, RefillItemWithName, OrderMarker } from '../types'
import { barcodeLookupKeys } from '../utils/barcode'
import { currentYearMonth, isExpiringSoon } from '../utils/expiry'
import { getPrimaryName, getSecondaryName } from '../utils/medicationDisplay'
import { v4 as uuidv4 } from 'uuid'

// ──────────────── Medications ────────────────

export async function getAllMedications(): Promise<MedicationWithBatches[]> {
  const meds = await db.medications.toArray()
  return Promise.all(meds.map(enrichWithBatches))
}

export async function getMedicationByBarcode(barcode: string): Promise<MedicationWithBatches | null> {
  const med = await db.medications.where('barcode').equals(barcode).first()
  if (!med) return null
  return enrichWithBatches(med)
}

export async function findMedicationByScan(raw: string): Promise<MedicationWithBatches | null> {
  for (const key of barcodeLookupKeys(raw)) {
    const med = await getMedicationByBarcode(key)
    if (med) return med
  }
  return null
}

/**
 * Findet bestehendes Medikament nur bei echtem Namens-Match:
 * - Mit Handelsname → nur gleicher Handelsname (nicht nur gleicher Wirkstoff)
 * - Ohne Handelsname → Abgleich per Wirkstoffname
 */
export async function findExistingMedication(
  handelsname: string,
  wirkstoffname: string,
): Promise<MedicationWithBatches | null> {
  const h = handelsname.trim()
  const w = wirkstoffname.trim()
  if (h) {
    const med = await db.medications.where('handelsname').equalsIgnoreCase(h).first()
    if (med) return enrichWithBatches(med)
    return null
  }
  if (w) {
    const med = await db.medications.where('wirkstoffname').equalsIgnoreCase(w).first()
    if (med) return enrichWithBatches(med)
  }
  return null
}

async function enrichWithBatches(med: Medication): Promise<MedicationWithBatches> {
  const batches = await db.medication_batches
    .where('medication_id')
    .equals(med.id!)
    .toArray()
  const totalQuantity = batches.reduce((s, b) => s + b.quantity, 0)
  return { ...med, batches, totalQuantity }
}

export async function addMedication(med: Omit<Medication, 'id'>): Promise<number> {
  return db.medications.add(med)
}

export async function updateMedication(id: number, changes: Partial<Medication>): Promise<void> {
  await db.medications.update(id, changes)
}

export async function deleteMedication(id: number): Promise<void> {
  const med = await db.medications.get(id)
  await db.transaction(
    'rw',
    db.medications,
    db.medication_batches,
    db.refill_list,
    db.order_markers,
    db.photos,
    async () => {
      await db.medication_batches.where('medication_id').equals(id).delete()
      await db.refill_list.where('medication_id').equals(id).delete()
      await db.order_markers.where('medication_id').equals(id).delete()
      if (med?.photo_blob_id) await db.photos.delete(med.photo_blob_id)
      await db.medications.delete(id)
    },
  )
}

// ──────────────── Batches ────────────────

export async function addOrUpdateBatch(
  medicationId: number,
  expiryDate: string,
  addQty: number,
): Promise<void> {
  const existing = await db.medication_batches
    .where('[medication_id+expiry_date]')
    .equals([medicationId, expiryDate])
    .first()
  if (existing) {
    await db.medication_batches.update(existing.id!, { quantity: existing.quantity + addQty })
  } else {
    await db.medication_batches.add({ medication_id: medicationId, expiry_date: expiryDate, quantity: addQty })
  }
}

export async function decrementBatch(batchId: number): Promise<void> {
  const batch = await db.medication_batches.get(batchId)
  if (!batch) return
  if (batch.quantity <= 1) {
    await db.medication_batches.delete(batchId)
  } else {
    await db.medication_batches.update(batchId, { quantity: batch.quantity - 1 })
  }
}

export async function deleteBatch(batchId: number): Promise<void> {
  await db.transaction('rw', db.medication_batches, db.order_markers, async () => {
    await db.order_markers.where('[target_type+target_id]').equals(['batch', batchId]).delete()
    await db.medication_batches.delete(batchId)
  })
}

// ──────────────── Refill List ────────────────

export async function getRefillList(): Promise<RefillItemWithName[]> {
  const items = await db.refill_list.toArray()
  return Promise.all(
    items.map(async (item) => {
      const med = await db.medications.get(item.medication_id)
      return {
        ...item,
        medication_name: med ? getPrimaryName(med) : 'Unbekannt',
        medication_secondary: med ? getSecondaryName(med) : null,
        barcode: med?.barcode ?? '',
      }
    }),
  )
}

export async function addOrIncrementRefill(medicationId: number): Promise<void> {
  const existing = await db.refill_list.where('medication_id').equals(medicationId).first()
  if (existing) {
    await db.refill_list.update(existing.id!, { amount_needed: existing.amount_needed + 1 })
  } else {
    await db.refill_list.add({ medication_id: medicationId, amount_needed: 1 })
  }
}

export async function removeRefillItem(id: number): Promise<void> {
  await db.transaction('rw', db.refill_list, db.order_markers, async () => {
    await db.order_markers.where('[target_type+target_id]').equals(['refill', id]).delete()
    await db.refill_list.delete(id)
  })
}

// ──────────────── Order markers (Nachfüllen: bestellt) ────────────────

export async function getOrderMarkers(): Promise<OrderMarker[]> {
  return db.order_markers.toArray()
}

export async function markBatchesOrdered(
  batches: MedicationBatch[],
  medicationId: number,
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.order_markers, async () => {
    for (const batch of batches) {
      if (batch.id == null) continue
      const existing = await db.order_markers
        .where('[target_type+target_id]')
        .equals(['batch', batch.id])
        .first()
      if (!existing) {
        await db.order_markers.add({
          target_type: 'batch',
          target_id: batch.id,
          medication_id: medicationId,
          ordered_at: now,
        })
      }
    }
  })
}

export async function unmarkBatchesOrdered(batches: MedicationBatch[]): Promise<void> {
  await db.transaction('rw', db.order_markers, async () => {
    for (const batch of batches) {
      if (batch.id == null) continue
      await db.order_markers.where('[target_type+target_id]').equals(['batch', batch.id]).delete()
    }
  })
}

export async function markRefillOrdered(refillId: number, medicationId: number): Promise<void> {
  const existing = await db.order_markers
    .where('[target_type+target_id]')
    .equals(['refill', refillId])
    .first()
  if (!existing) {
    await db.order_markers.add({
      target_type: 'refill',
      target_id: refillId,
      medication_id: medicationId,
      ordered_at: new Date().toISOString(),
    })
  }
}

export async function unmarkRefillOrdered(refillId: number): Promise<void> {
  await db.order_markers.where('[target_type+target_id]').equals(['refill', refillId]).delete()
}

// ──────────────── Photos ────────────────

export async function savePhoto(blob: Blob): Promise<string> {
  const id = uuidv4()
  await db.photos.add({ id, blob })
  return id
}

export async function getPhoto(id: string): Promise<Blob | undefined> {
  const p = await db.photos.get(id)
  return p?.blob
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id)
}

// ──────────────── Expired / expiring meds (computed) ────────────────

export type MedicationExpiryGroup = { medication: Medication; batches: MedicationBatch[] }

async function groupBatchesByMedication(batches: MedicationBatch[]): Promise<MedicationExpiryGroup[]> {
  const grouped = new Map<number, MedicationBatch[]>()
  for (const b of batches) {
    const arr = grouped.get(b.medication_id) ?? []
    arr.push(b)
    grouped.set(b.medication_id, arr)
  }
  const groups = await Promise.all(
    Array.from(grouped.entries()).map(async ([medId, medBatches]) => {
      const medication = (await db.medications.get(medId))!
      return { medication, batches: medBatches }
    }),
  )
  return groups.sort((a, b) =>
    getPrimaryName(a.medication).localeCompare(getPrimaryName(b.medication), 'de'),
  )
}

export async function getExpiredBatches(): Promise<MedicationExpiryGroup[]> {
  const current = currentYearMonth()
  const allBatches = await db.medication_batches.toArray()
  const expiredBatches = allBatches.filter(
    (b) => b.expiry_date < current && b.quantity > 0,
  )
  return groupBatchesByMedication(expiredBatches)
}

export async function getExpiringSoonBatches(months = 3): Promise<MedicationExpiryGroup[]> {
  const allBatches = await db.medication_batches.toArray()
  const soonBatches = allBatches.filter(
    (b) => b.quantity > 0 && isExpiringSoon(b.expiry_date, months),
  )
  return groupBatchesByMedication(soonBatches)
}
