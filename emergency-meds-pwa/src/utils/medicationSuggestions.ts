import { MEDICATION_CATALOG } from '../data/medicationCatalog'
import type { DisplayNameField } from './medicationDisplay'
import { hasAnyName } from './medicationDisplay'

export type SuggestionSource = 'catalog' | 'local'

export interface MedicationSuggestion {
  handelsname: string
  wirkstoffname: string
  display_name: DisplayNameField
  ml_per_ampule?: number
  mg_per_ml?: number
  source: SuggestionSource
}

type SuggestionInput = Pick<
  MedicationSuggestion,
  'handelsname' | 'wirkstoffname' | 'display_name' | 'ml_per_ampule' | 'mg_per_ml'
>

function suggestionKey(s: SuggestionInput): string {
  return `${s.handelsname.trim().toLowerCase()}|${s.wirkstoffname.trim().toLowerCase()}`
}

export function buildSuggestionPool(localMeds: SuggestionInput[] = []): MedicationSuggestion[] {
  const seen = new Set<string>()
  const pool: MedicationSuggestion[] = []

  for (const entry of [...MEDICATION_CATALOG, ...localMeds.map((m) => ({ ...m, source: 'local' as const }))]) {
    if (!hasAnyName(entry.handelsname, entry.wirkstoffname)) continue
    const key = suggestionKey(entry)
    if (seen.has(key)) continue
    seen.add(key)
    pool.push({
      handelsname: entry.handelsname.trim(),
      wirkstoffname: entry.wirkstoffname.trim(),
      display_name: entry.display_name ?? 'handelsname',
      ml_per_ampule: entry.ml_per_ampule,
      mg_per_ml: entry.mg_per_ml,
      source: 'source' in entry && entry.source === 'local' ? 'local' : 'catalog',
    })
  }

  return pool
}

function matchScore(s: MedicationSuggestion, q: string): number {
  const h = s.handelsname.toLowerCase()
  const w = s.wirkstoffname.toLowerCase()
  if (h.startsWith(q) || w.startsWith(q)) return 0
  if (h.includes(q) || w.includes(q)) return 1
  return 2
}

export function searchMedicationSuggestions(
  query: string,
  pool: MedicationSuggestion[],
  limit = 8,
): MedicationSuggestion[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  return pool
    .filter((s) => {
      const h = s.handelsname.toLowerCase()
      const w = s.wirkstoffname.toLowerCase()
      return h.includes(q) || w.includes(q)
    })
    .sort((a, b) => {
      const scoreDiff = matchScore(a, q) - matchScore(b, q)
      if (scoreDiff !== 0) return scoreDiff
      const labelA = formatSuggestionLabel(a)
      const labelB = formatSuggestionLabel(b)
      return labelA.localeCompare(labelB, 'de')
    })
    .slice(0, limit)
}

export function formatSuggestionLabel(s: MedicationSuggestion): string {
  const h = s.handelsname.trim()
  const w = s.wirkstoffname.trim()
  if (h && w) return `${h} · ${w}`
  return h || w
}

export function formatSuggestionDetail(s: MedicationSuggestion): string | null {
  const parts: string[] = []
  if (s.ml_per_ampule != null) parts.push(`${s.ml_per_ampule} ml/Amp`)
  if (s.mg_per_ml != null) parts.push(`${s.mg_per_ml} mg/ml`)
  return parts.length ? parts.join(' · ') : null
}
