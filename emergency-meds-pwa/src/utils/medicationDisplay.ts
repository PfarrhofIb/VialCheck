import type { Medication, DisplayNameField } from '../types'

export type { DisplayNameField }

type NameFields = Pick<Medication, 'handelsname' | 'wirkstoffname' | 'display_name'>

export function getPrimaryName(med: NameFields): string {
  const chosen = med.display_name === 'wirkstoffname' ? med.wirkstoffname : med.handelsname
  const other = med.display_name === 'wirkstoffname' ? med.handelsname : med.wirkstoffname
  return (chosen?.trim() || other?.trim() || 'Unbenannt')
}

export function getSecondaryName(med: NameFields): string | null {
  const primary = med.display_name === 'wirkstoffname' ? med.wirkstoffname : med.handelsname
  const secondary = med.display_name === 'wirkstoffname' ? med.handelsname : med.wirkstoffname
  const p = primary?.trim() ?? ''
  const s = secondary?.trim() ?? ''
  if (!s || s.toLowerCase() === p.toLowerCase()) return null
  return s
}

export function medicationMatchesSearch(
  med: NameFields & { storage_location?: string },
  query: string,
): boolean {
  const q = query.toLowerCase()
  return (
    (med.handelsname?.toLowerCase().includes(q) ?? false) ||
    (med.wirkstoffname?.toLowerCase().includes(q) ?? false) ||
    (med.storage_location?.toLowerCase().includes(q) ?? false)
  )
}

export function hasAnyName(handelsname: string, wirkstoffname: string): boolean {
  return !!(handelsname.trim() || wirkstoffname.trim())
}

/** mg/Ampulle aus ml/Ampulle × mg/ml */
export function getMgPerAmpule(med: {
  ml_per_ampule?: number
  mg_per_ml?: number
}): number | null {
  if (med.ml_per_ampule == null || med.mg_per_ml == null) return null
  return med.ml_per_ampule * med.mg_per_ml
}

/** Anzeigezeile: „2 ml · 500 mg/ml · 1000 mg/Ampulle“ */
export function formatConcentrationLine(med: {
  ml_per_ampule?: number
  mg_per_ml?: number
}): string | null {
  const parts: string[] = []
  if (med.ml_per_ampule != null) parts.push(`${med.ml_per_ampule} ml`)
  if (med.mg_per_ml != null) parts.push(`${med.mg_per_ml} mg/ml`)
  const mgAmp = getMgPerAmpule(med)
  if (mgAmp != null) {
    const n = Number.isInteger(mgAmp) ? mgAmp : parseFloat(mgAmp.toFixed(2))
    parts.push(`${n} mg/Ampulle`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

/** Alte Backups / Migration: `name` → handelsname */
export function normalizeMedicationFields(
  med: Record<string, unknown>,
): Pick<Medication, 'handelsname' | 'wirkstoffname' | 'display_name'> {
  if (typeof med.handelsname === 'string' || typeof med.wirkstoffname === 'string') {
    return {
      handelsname: String(med.handelsname ?? ''),
      wirkstoffname: String(med.wirkstoffname ?? ''),
      display_name: (med.display_name as DisplayNameField) ?? 'handelsname',
    }
  }
  const legacyName = typeof med.name === 'string' ? med.name : ''
  return {
    handelsname: legacyName,
    wirkstoffname: '',
    display_name: 'handelsname',
  }
}
