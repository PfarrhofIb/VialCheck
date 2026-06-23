import { formatYearMonth, expiryColorClass, isExpired, isExpiringSoon } from './expiry'
import { MATERIAL_MODE_LABELS, VARIANT_PRESET_LABELS } from './materialVariants'
import type { MaterialLot, MaterialWithLots } from '../types/material'

export function materialMatchesSearch(mat: MaterialWithLots, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (mat.name.toLowerCase().includes(q)) return true
  return mat.lots.some((l) => l.variant_label?.toLowerCase().includes(q))
}

export function lotExpiryColorClass(expiryDate?: string): string {
  if (!expiryDate) return 'text-gray-600'
  return expiryColorClass(expiryDate)
}

export function materialHasExpiredLots(mat: MaterialWithLots): boolean {
  return mat.lots.some((l) => l.expiry_date && isExpired(l.expiry_date) && l.quantity > 0)
}

export function materialHasExpiringSoonLots(mat: MaterialWithLots): boolean {
  return mat.lots.some(
    (l) => l.expiry_date && isExpiringSoon(l.expiry_date) && l.quantity > 0,
  )
}

export function formatLotLabel(lot: MaterialLot): string {
  const parts: string[] = []
  if (lot.variant_label) parts.push(lot.variant_label)
  if (lot.expiry_date) parts.push(formatYearMonth(lot.expiry_date))
  return parts.join(' · ') || 'Bestand'
}

export function sortMaterialLots(lots: MaterialLot[]): MaterialLot[] {
  return [...lots].sort((a, b) => {
    const variantCmp = (a.variant_label ?? '').localeCompare(b.variant_label ?? '', 'de')
    if (variantCmp !== 0) return variantCmp
    if (!a.expiry_date && !b.expiry_date) return 0
    if (!a.expiry_date) return 1
    if (!b.expiry_date) return -1
    return a.expiry_date.localeCompare(b.expiry_date)
  })
}

export function getMaterialSubtitle(material: {
  mode: string
  variant_preset?: string
}): string {
  if (material.mode === 'variant' && material.variant_preset) {
    const preset = material.variant_preset as keyof typeof VARIANT_PRESET_LABELS
    return `${MATERIAL_MODE_LABELS.variant} · ${VARIANT_PRESET_LABELS[preset]}`
  }
  return MATERIAL_MODE_LABELS[material.mode] ?? material.mode
}
