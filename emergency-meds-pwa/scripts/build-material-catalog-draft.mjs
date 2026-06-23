import XLSX from 'xlsx'
import fs from 'fs'

const data = XLSX.utils.sheet_to_json(
  XLSX.readFile('p:/Cursor/BilderUpload/Notfallrucksack Inventar Haltbarkeit.xlsx').Sheets.Tabelle1,
  { header: 1, defval: '' },
)

const MED_SECTIONS = new Set(['Ampullarium'])
const SKIP_NAMES = /^(Absaugpumpe|Gefäß|Starrer Sauger|Absaugkatheter)/i

let section = null
const raw = []

for (const row of data) {
  const name = String(row[0] || '').trim()
  if (!name || name === 'Notfallrucksack') continue
  const soll = row[1]
  const ist = row[2]
  if (soll === 'Soll' && ist === 'Ist') continue

  const looksLikeSection =
    soll === '' &&
    ist === '' &&
    row[3] === '' &&
    /tasche|fach|Ampullarium|Absaugung/i.test(name) &&
    !/^\d/.test(name)

  if (looksLikeSection && typeof row[1] !== 'number') {
    section = name
    continue
  }
  if (MED_SECTIONS.has(section)) continue
  if (SKIP_NAMES.test(name) && soll === '' && ist === '') continue
  if (typeof soll !== 'number' && typeof ist !== 'number' && !row[3]) continue

  raw.push({ name, section })
}

function classify(name) {
  const n = name.toLowerCase()
  if (/^venflon (gelb|blau|rosa|grün|grau|weiß|orange)/i.test(name)) {
    return { mode: 'variant', variant_preset: 'venflon', catalogName: 'Venflon' }
  }
  if (/^et [0-9]/i.test(name)) {
    return { mode: 'variant', variant_preset: 'tubus_mm', catalogName: 'ET-Tubus' }
  }
  if (/^lma auragain/i.test(name)) {
    return { mode: 'simple', catalogName: name }
  }
  if (/^guedel/i.test(name)) return { mode: 'variant', variant_preset: 'tubus_mm', catalogName: 'Guedel' }
  if (/^magill/i.test(name)) return { mode: 'variant', variant_preset: 'tubus_mm', catalogName: 'Magill' }
  if (/^spritze /i.test(name)) return { mode: 'simple', catalogName: name }

  const withMhdHints =
    /infusion|elomel|gelofusin|nacl|kompressen|pflaster|hahn|spike|ventil|stöpsel|aufziekanüle|stepty|co2|venflonpflaster|opsite|isareli/i.test(
      n,
    )
  const noMhd =
    /schere|splint|tourniquet|stethoskop|ambu|maske|wendel|gleitgel|stauschlauch|tupfer|alkotupfer|decke|tuch|klemme|stapler|handschuh|griff|mandrin|o2-|blocker|edding|kugelschreiber|peha|mullbinde|gauze|aludecke|diagnostik|pulsox|rr |blutzucker|fixierung|schlauch|mad|stift|peep|skalpell|intubationsbesteck|spatel|absaugkatheter grün/i.test(
      n,
    )

  if (noMhd && !withMhdHints) return { mode: 'no_expiry', catalogName: name }
  return { mode: 'simple', catalogName: name }
}

const map = new Map()
for (const { name, section: sec } of raw) {
  const c = classify(name)
  const key = `${c.catalogName}|${c.mode}|${c.variant_preset || ''}`
  if (!map.has(key)) {
    map.set(key, { ...c })
  }
}

const entries = [...map.values()].sort((a, b) => {
  const mo = { variant: 0, simple: 1, no_expiry: 2 }
  return mo[a.mode] - mo[b.mode] || a.catalogName.localeCompare(b.catalogName, 'de')
})

const lines = [
  '/**',
  ' * ENTWURF – Material-Katalog aus „Notfallrucksack Inventar Haltbarkeit.xlsx“',
  ' * Nur zur Review. Nicht eingebunden. Keine Medikamente (Ampullarium ausgeschlossen).',
  ` * Generiert: ${new Date().toISOString().slice(0, 10)}`,
  ' */',
  "import type { MaterialMode, VariantPreset } from '../types/material'",
  '',
  'export interface MaterialCatalogEntry {',
  '  name: string',
  '  mode: MaterialMode',
  '  variant_preset?: VariantPreset',
  '  /** Typische Einsortier-Orte aus der Excel-Liste */',
  '  storage_hints?: string[]',
  '}',
  '',
  'export const MATERIAL_CATALOG_DRAFT: MaterialCatalogEntry[] = [',
]

for (const e of entries) {
  const parts = [`name: '${e.catalogName.replace(/'/g, "\\'")}'`, `mode: '${e.mode}'`]
  if (e.variant_preset) parts.push(`variant_preset: '${e.variant_preset}'`)
  lines.push(`  { ${parts.join(', ')} },`)
}
lines.push(']', '')

const outPath = new URL('../src/data/materialCatalog.draft.ts', import.meta.url)
fs.writeFileSync(outPath, lines.join('\n'))

const counts = { variant: 0, simple: 0, no_expiry: 0 }
for (const e of entries) counts[e.mode]++
console.log('Entries:', entries.length, counts)
