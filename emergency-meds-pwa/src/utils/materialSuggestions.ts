import { MATERIAL_CATALOG } from '../data/materialCatalog'
import type { MaterialCatalogEntry } from '../data/materialCatalog'
import { MATERIAL_MODE_LABELS } from './materialVariants'

export type MaterialSuggestionSource = 'catalog' | 'local'

export interface MaterialSuggestion extends MaterialCatalogEntry {
  source: MaterialSuggestionSource
}

type LocalMaterial = Pick<MaterialCatalogEntry, 'name' | 'mode' | 'variant_preset'>

function suggestionKey(name: string): string {
  return name.trim().toLowerCase()
}

export function buildMaterialSuggestionPool(localMaterials: LocalMaterial[] = []): MaterialSuggestion[] {
  const seen = new Set<string>()
  const pool: MaterialSuggestion[] = []

  for (const entry of [
    ...MATERIAL_CATALOG.map((e) => ({ ...e, source: 'catalog' as const })),
    ...localMaterials.map((m) => ({ ...m, source: 'local' as const })),
  ]) {
    const key = suggestionKey(entry.name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    pool.push({
      name: entry.name.trim(),
      mode: entry.mode,
      variant_preset: entry.variant_preset,
      source: entry.source,
    })
  }

  return pool
}

function matchScore(s: MaterialSuggestion, q: string): number {
  const n = s.name.toLowerCase()
  if (n.startsWith(q)) return 0
  if (n.includes(q)) return 1
  return 2
}

export function searchMaterialSuggestions(
  query: string,
  pool: MaterialSuggestion[],
  limit = 8,
): MaterialSuggestion[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  return pool
    .filter((s) => s.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const scoreDiff = matchScore(a, q) - matchScore(b, q)
      if (scoreDiff !== 0) return scoreDiff
      return a.name.localeCompare(b.name, 'de')
    })
    .slice(0, limit)
}

export function formatMaterialSuggestionDetail(s: MaterialSuggestion): string {
  if (s.mode === 'variant' && s.variant_preset) {
    return MATERIAL_MODE_LABELS.variant
  }
  return MATERIAL_MODE_LABELS[s.mode] ?? s.mode
}
