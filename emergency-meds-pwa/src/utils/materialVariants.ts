import type { MaterialMode, VariantPreset } from '../types/material'

/** Größen 1,0 – 10,0 in 0,5-Schritten (Tubus, Magill, Guedel, Sonden). */
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

export const LARYNXMASKE_AURAGAIN_SIZES = ['1', '1,5', '2', '2,5', '3', '4', '5']

export const SPRITZE_ML_SIZES = ['1 ml', '2 ml', '5 ml', '10 ml', '20 ml']

export const SPATEL_MACINTOSH_SIZES = ['2', '3', '4']

export const SPATEL_MILLER_SIZES = ['0', '1']

export const MASKE_GROESSE_SIZES = ['groß', 'klein', 'mittel']

export const ALL_VARIANT_PRESETS: VariantPreset[] = [
  'tubus_mm',
  'venflon',
  'larynxmaske_auragain',
  'spritze_ml',
  'spatel_macintosh',
  'spatel_miller',
  'maske_groesse',
]

export function variantsForPreset(preset: VariantPreset): string[] {
  switch (preset) {
    case 'venflon':
      return VENFLON_VARIANTS
    case 'larynxmaske_auragain':
      return LARYNXMASKE_AURAGAIN_SIZES
    case 'spritze_ml':
      return SPRITZE_ML_SIZES
    case 'spatel_macintosh':
      return SPATEL_MACINTOSH_SIZES
    case 'spatel_miller':
      return SPATEL_MILLER_SIZES
    case 'maske_groesse':
      return MASKE_GROESSE_SIZES
    default:
      return TUBUS_MM_SIZES
  }
}

/** Masken: Variante ohne Pflicht-MHD. */
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
  larynxmaske_auragain: 'Größe',
  spritze_ml: 'Volumen',
  spatel_macintosh: 'Macintosh',
  spatel_miller: 'Miller',
  maske_groesse: 'Größe',
}

export const VARIANT_PRESET_HINTS: Record<VariantPreset, string> = {
  tubus_mm: 'Tubus, Magill, Guedel',
  venflon: 'Farbe und Größe',
  larynxmaske_auragain: 'Larynxmaske AuraGain',
  spritze_ml: '1 – 20 ml',
  spatel_macintosh: 'Spatel Macintosh',
  spatel_miller: 'Spatel Miller',
  maske_groesse: 'Beatmungsmaske',
}

export const MATERIAL_MODE_LABELS: Record<string, string> = {
  simple: 'Einfach (mit MHD)',
  variant: 'Mit Größe / Variante',
  no_expiry: 'Ohne MHD',
}
