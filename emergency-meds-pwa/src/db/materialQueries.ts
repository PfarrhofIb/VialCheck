import { db } from './schema'
import type {
  Material,
  MaterialLot,
  MaterialWithLots,
  MaterialRefillItemWithName,
  MaterialOrderMarker,
} from '../types/material'
import { currentYearMonth, isExpiringSoon, nextYearMonth } from '../utils/expiry'

async function enrichWithLots(mat: Material): Promise<MaterialWithLots> {
  const lots = await db.material_lots.where('material_id').equals(mat.id!).toArray()
  const totalQuantity = lots.reduce((s, l) => s + l.quantity, 0)
  return { ...mat, lots, totalQuantity }
}

export async function getAllMaterials(): Promise<MaterialWithLots[]> {
  const materials = await db.materials.toArray()
  return Promise.all(materials.map(enrichWithLots))
}

export async function addMaterial(material: Omit<Material, 'id'>): Promise<number> {
  return db.materials.add(material)
}

export async function addMaterialWithLot(
  material: Omit<Material, 'id'>,
  lot: Omit<MaterialLot, 'id' | 'material_id'>,
): Promise<number> {
  return db.transaction('rw', db.materials, db.material_lots, async () => {
    const id = await db.materials.add(material)
    await db.material_lots.add({ ...lot, material_id: id })
    return id
  })
}

export async function updateMaterial(id: number, changes: Partial<Material>): Promise<void> {
  await db.materials.update(id, changes)
}

export async function deleteMaterial(id: number): Promise<void> {
  const mat = await db.materials.get(id)
  await db.transaction(
    'rw',
    db.materials,
    db.material_lots,
    db.material_refill_list,
    db.material_order_markers,
    db.photos,
    async () => {
      await db.material_lots.where('material_id').equals(id).delete()
      await db.material_refill_list.where('material_id').equals(id).delete()
      await db.material_order_markers.where('material_id').equals(id).delete()
      if (mat?.photo_blob_id) await db.photos.delete(mat.photo_blob_id)
      await db.materials.delete(id)
    },
  )
}

export async function addOrUpdateMaterialLot(
  materialId: number,
  expiryDate: string | undefined,
  variantLabel: string | undefined,
  addQty: number,
): Promise<void> {
  const lots = await db.material_lots.where('material_id').equals(materialId).toArray()
  const existing = lots.find(
    (l) =>
      (l.expiry_date ?? '') === (expiryDate ?? '') &&
      (l.variant_label ?? '') === (variantLabel ?? ''),
  )
  if (existing) {
    await db.material_lots.update(existing.id!, { quantity: existing.quantity + addQty })
  } else {
    await db.material_lots.add({
      material_id: materialId,
      expiry_date: expiryDate,
      variant_label: variantLabel,
      quantity: addQty,
    })
  }
}

export async function decrementMaterialLot(lotId: number): Promise<void> {
  const lot = await db.material_lots.get(lotId)
  if (!lot) return
  if (lot.quantity <= 1) {
    await db.material_lots.delete(lotId)
  } else {
    await db.material_lots.update(lotId, { quantity: lot.quantity - 1 })
  }
}

export async function deleteMaterialLot(lotId: number): Promise<void> {
  await db.transaction('rw', db.material_lots, db.material_order_markers, async () => {
    await db.material_order_markers
      .where('[target_type+target_id]')
      .equals(['material_lot', lotId])
      .delete()
    await db.material_lots.delete(lotId)
  })
}

export async function updateMaterialLot(lotId: number, changes: Partial<MaterialLot>): Promise<void> {
  await db.material_lots.update(lotId, changes)
}

export type MaterialExpiryGroup = { material: Material; lots: MaterialLot[] }

function groupLotsByMaterial(
  materials: MaterialWithLots[],
  filter: (lot: MaterialLot) => boolean,
): MaterialExpiryGroup[] {
  const groups: MaterialExpiryGroup[] = []
  for (const m of materials) {
    const lots = m.lots.filter(filter)
    if (lots.length) groups.push({ material: m, lots })
  }
  return groups.sort((a, b) => a.material.name.localeCompare(b.material.name, 'de'))
}

export async function getExpiredMaterialLots(): Promise<MaterialExpiryGroup[]> {
  const materials = await getAllMaterials()
  const now = currentYearMonth()
  return groupLotsByMaterial(
    materials,
    (l) => !!l.expiry_date && l.expiry_date < now && l.quantity > 0,
  )
}

export async function getExpiringSoonMaterialLots(months = 3): Promise<MaterialExpiryGroup[]> {
  const materials = await getAllMaterials()
  const now = currentYearMonth()
  return groupLotsByMaterial(
    materials,
    (l) =>
      !!l.expiry_date &&
      l.expiry_date >= now &&
      isExpiringSoon(l.expiry_date, months) &&
      l.quantity > 0,
  )
}

// ──────────────── Material refill list ────────────────

export async function getMaterialRefillList(): Promise<MaterialRefillItemWithName[]> {
  const items = await db.material_refill_list.toArray()
  return Promise.all(
    items.map(async (item) => {
      const mat = await db.materials.get(item.material_id)
      return {
        ...item,
        material_name: mat?.name ?? 'Unbekannt',
      }
    }),
  )
}

export async function addOrIncrementMaterialRefill(materialId: number): Promise<void> {
  const existing = await db.material_refill_list.where('material_id').equals(materialId).first()
  if (existing) {
    await db.material_refill_list.update(existing.id!, {
      amount_needed: existing.amount_needed + 1,
    })
  } else {
    await db.material_refill_list.add({ material_id: materialId, amount_needed: 1 })
  }
}

export async function removeMaterialRefillItem(id: number): Promise<void> {
  await db.transaction('rw', db.material_refill_list, db.material_order_markers, async () => {
    await db.material_order_markers
      .where('[target_type+target_id]')
      .equals(['material_refill', id])
      .delete()
    await db.material_refill_list.delete(id)
  })
}

// ──────────────── Material order markers ────────────────

export async function getMaterialOrderMarkers(): Promise<MaterialOrderMarker[]> {
  return db.material_order_markers.toArray()
}

export async function markMaterialLotsOrdered(
  lots: MaterialLot[],
  materialId: number,
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', db.material_order_markers, async () => {
    for (const lot of lots) {
      if (lot.id == null) continue
      const existing = await db.material_order_markers
        .where('[target_type+target_id]')
        .equals(['material_lot', lot.id])
        .first()
      if (!existing) {
        await db.material_order_markers.add({
          target_type: 'material_lot',
          target_id: lot.id,
          material_id: materialId,
          ordered_at: now,
        })
      }
    }
  })
}

export async function unmarkMaterialLotsOrdered(lots: MaterialLot[]): Promise<void> {
  await db.transaction('rw', db.material_order_markers, async () => {
    for (const lot of lots) {
      if (lot.id == null) continue
      await db.material_order_markers
        .where('[target_type+target_id]')
        .equals(['material_lot', lot.id])
        .delete()
    }
  })
}

export async function markMaterialRefillOrdered(
  refillId: number,
  materialId: number,
): Promise<void> {
  const existing = await db.material_order_markers
    .where('[target_type+target_id]')
    .equals(['material_refill', refillId])
    .first()
  if (!existing) {
    await db.material_order_markers.add({
      target_type: 'material_refill',
      target_id: refillId,
      material_id: materialId,
      ordered_at: new Date().toISOString(),
    })
  }
}

export async function unmarkMaterialRefillOrdered(refillId: number): Promise<void> {
  await db.material_order_markers
    .where('[target_type+target_id]')
    .equals(['material_refill', refillId])
    .delete()
}

export function getExpiringNextMonthMaterialGroups(
  materials: MaterialWithLots[],
): MaterialExpiryGroup[] {
  const targetMonth = nextYearMonth()
  return groupLotsByMaterial(
    materials,
    (l) => l.quantity > 0 && l.expiry_date === targetMonth,
  )
}
