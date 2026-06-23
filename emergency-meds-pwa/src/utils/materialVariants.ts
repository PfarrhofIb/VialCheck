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

/** Guedel: ISO-Größennummer (nicht Tubus-mm). */
export const GUEDEL_SIZES = ['000', '00', '0', '1', '2', '3', '4', '5']

export const MAGILL_CM_SIZES = ['15 cm', '20 cm', '25 cm']

export const LARYNXMASKE_AURAGAIN_SIZES = ['1', '1,5', '2', '2,5', '3', '4', '5', '6']

export const IGEL_SIZES = ['1', '1,5', '2', '2,5', '3', '4', '5']

export const SPRITZE_ML_SIZES = ['1 ml', '2 ml', '5 ml', '10 ml', '20 ml', '50 ml']

export const SPATEL_MACINTOSH_SIZES = ['0', '1', '2', '3', '4']

export const SPATEL_MILLER_SIZES = ['00', '0', '1', '2', '3', '4']

/** Beatmungsmasken nach üblicher Nummerierung (BVM). */
export const MASKE_NUMMER_SIZES = ['0', '1', '2', '3', '4', '5']

/** Absaugkatheter: Charrière + Farbe am Trichter (ISO-üblich). */
export const ABSAUGKATHETER_CH_SIZES = [
  '6 CH hellgrün',
  '8 CH blau',
  '10 CH schwarz',
  '12 CH weiß',
  '14 CH grün',
  '16 CH orange',
]

export const ALL_VARIANT_PRESETS: VariantPreset[] = [
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

export function variantsForPreset(preset: VariantPreset): string[] {
  switch (preset) {
    case 'venflon':
      return VENFLON_VARIANTS
    case 'guedel_groesse':
      return GUEDEL_SIZES
    case 'magill_cm':
      return MAGILL_CM_SIZES
    case 'larynxmaske_auragain':
      return LARYNXMASKE_AURAGAIN_SIZES
    case 'igel_groesse':
      return IGEL_SIZES
    case 'spritze_ml':
      return SPRITZE_ML_SIZES
    case 'spatel_macintosh':
      return SPATEL_MACINTOSH_SIZES
    case 'spatel_miller':
      return SPATEL_MILLER_SIZES
    case 'maske_groesse':
      return MASKE_NUMMER_SIZES
    case 'absaugkatheter_ch':
      return ABSAUGKATHETER_CH_SIZES
    default:
      return TUBUS_MM_SIZES
  }
}

/** Beatmungsmasken: Variante ohne Pflicht-MHD. */
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
  guedel_groesse: 'Guedel-Tubus 000 – 5',
  magill_cm: 'Magill-Zange',
  larynxmaske_auragain: 'Ambu AuraGain',
  igel_groesse: 'Intersurgical i-gel',
  spritze_ml: '1 – 50 ml',
  spatel_macintosh: 'Spatel Macintosh 0 – 4',
  spatel_miller: 'Spatel Miller 00 – 4',
  maske_groesse: 'Beatmungsmaske 0 – 5',
  absaugkatheter_ch: 'CH und Farbe',
}

export const MATERIAL_MODE_LABELS: Record<string, string> = {
  simple: 'Einfach (mit MHD)',
  variant: 'Mit Größe / Variante',
  no_expiry: 'Ohne MHD',
}
