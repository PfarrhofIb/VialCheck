import type { MaterialMode, VariantPreset } from '../types/material'

/** ET-Tubus: Innendurchmesser 1,0 – 10,0 mm in 0,5-Schritten. */
export const TUBUS_MM_SIZES: string[] = Array.from({ length: 19 }, (_, i) => {
  const v = 1 + i * 0.5
  return v.toFixed(1).replace('.', ',')
})

export const VENFLON_VARIANTS: string[] = [
  'Orange 14G',
  'Grau 16G',
  'Grün 18G',
  'Pink 20G',
  'Blau 22G',
  'Gelb 24G',
  'Violett 26G',
]

/** Guedel, Larynxmaske, i-gel, Beatmungsmaske — gemeinsame Nummerierung. */
export const GROESSE_NUMMER_SIZES = [
  '000',
  '00',
  '0',
  '1',
  '1,5',
  '2',
  '2,5',
  '3',
  '4',
  '5',
  '6',
]

/** @deprecated Alias — gleiche Werte wie {@link GROESSE_NUMMER_SIZES} */
export const GUEDEL_SIZES = GROESSE_NUMMER_SIZES

export const MAGILL_CM_SIZES = ['15 cm', '20 cm', '25 cm']

/** @deprecated Alias */
export const LARYNXMASKE_AURAGAIN_SIZES = GROESSE_NUMMER_SIZES

/** @deprecated Alias */
export const IGEL_SIZES = GROESSE_NUMMER_SIZES

export const SPRITZE_ML_SIZES = ['1 ml', '2 ml', '5 ml', '10 ml', '20 ml', '50 ml']

export const SPATEL_MACINTOSH_SIZES = ['0', '1', '2', '3', '4']

export const SPATEL_MILLER_SIZES = ['00', '0', '1', '2', '3', '4']

/** @deprecated Alias */
export const MASKE_NUMMER_SIZES = GROESSE_NUMMER_SIZES

/** Absaugkatheter: Charrière + Farbe am Trichter (ISO-üblich). */
export const ABSAUGKATHETER_CH_SIZES = [
  '6 CH hellgrün',
  '8 CH blau',
  '10 CH schwarz',
  '12 CH weiß',
  '14 CH grün',
  '16 CH orange',
]

const LEGACY_GROESSE_PRESETS: VariantPreset[] = [
  'guedel_groesse',
  'larynxmaske_auragain',
  'igel_groesse',
  'maske_groesse',
]

/** Alle Presets (inkl. Legacy für bestehende DB-Einträge). */
export const ALL_VARIANT_PRESETS: VariantPreset[] = [
  'groesse_nummer',
  'tubus_mm',
  'venflon',
  'guedel_groesse',
  'magill_cm',
  'larynxmaske_auragain',
  'igel_groesse',
  'spritze_ml',
  'spatel_macintosh',
  'spatel_miller',
  'maske_groesse',
  'absaugkatheter_ch',
]

/** Kurzliste für „Material hinzufügen“ (ohne Legacy-Duplikate). */
export const ADD_VARIANT_PRESETS: VariantPreset[] = [
  'groesse_nummer',
  'tubus_mm',
  'venflon',
  'magill_cm',
  'spritze_ml',
  'spatel_macintosh',
  'spatel_miller',
  'absaugkatheter_ch',
]

export function normalizePresetForAdd(preset: VariantPreset): VariantPreset {
  if (LEGACY_GROESSE_PRESETS.includes(preset)) return 'groesse_nummer'
  return preset
}

export function variantsForPreset(preset: VariantPreset): string[] {
  switch (preset) {
    case 'venflon':
      return VENFLON_VARIANTS
    case 'groesse_nummer':
    case 'guedel_groesse':
    case 'larynxmaske_auragain':
    case 'igel_groesse':
    case 'maske_groesse':
      return GROESSE_NUMMER_SIZES
    case 'magill_cm':
      return MAGILL_CM_SIZES
    case 'spritze_ml':
      return SPRITZE_ML_SIZES
    case 'spatel_macintosh':
      return SPATEL_MACINTOSH_SIZES
    case 'spatel_miller':
      return SPATEL_MILLER_SIZES
    case 'absaugkatheter_ch':
      return ABSAUGKATHETER_CH_SIZES
    default:
      return TUBUS_MM_SIZES
  }
}

/** Beatmungsmasken: Variante ohne Pflicht-MHD (Legacy-Preset). */
export function variantRequiresExpiry(preset: VariantPreset): boolean {
  return preset !== 'maske_groesse'
}

export function materialNeedsExpiry(material: {
  mode: MaterialMode
  variant_preset?: VariantPreset
}): boolean {
  if (material.mode === 'no_expiry') return false
  if (material.mode === 'simple') return true
  if (material.mode === 'variant' && material.variant_preset) {
    return variantRequiresExpiry(material.variant_preset)
  }
  return true
}

export const VARIANT_PRESET_LABELS: Record<VariantPreset, string> = {
  tubus_mm: 'Größe (mm)',
  venflon: 'Venflon',
  groesse_nummer: 'Größe',
  guedel_groesse: 'Größe',
  magill_cm: 'Länge',
  larynxmaske_auragain: 'Größe',
  igel_groesse: 'Größe',
  spritze_ml: 'Volumen',
  spatel_macintosh: 'Macintosh',
  spatel_miller: 'Miller',
  maske_groesse: 'Größe',
  absaugkatheter_ch: 'Charrière',
}

export const VARIANT_PRESET_HINTS: Record<VariantPreset, string> = {
  tubus_mm: 'Endotrachealtubus',
  venflon: 'Farbe und Größe',
  groesse_nummer: 'Guedel, Larynxmaske, i-gel, Maske',
  guedel_groesse: 'Guedel-Tubus',
  magill_cm: 'Magill-Zange',
  larynxmaske_auragain: 'Ambu AuraGain',
  igel_groesse: 'Intersurgical i-gel',
  spritze_ml: '1 – 50 ml',
  spatel_macintosh: 'Spatel Macintosh 0 – 4',
  spatel_miller: 'Spatel Miller 00 – 4',
  maske_groesse: 'Beatmungsmaske',
  absaugkatheter_ch: 'CH und Farbe',
}

export const MATERIAL_MODE_LABELS: Record<string, string> = {
  simple: 'Einfach',
  variant: 'Mit Größe / Variante',
  no_expiry: 'Einfach',
}
