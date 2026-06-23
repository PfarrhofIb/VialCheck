/** Größen 1,0 – 10,0 in 0,5-Schritten (Tubus, Magill, Guedel, Sonden). */
export const TUBUS_MM_SIZES: string[] = Array.from({ length: 19 }, (_, i) => {
  const v = 1 + i * 0.5
  return v.toFixed(1).replace('.', ',')
})

/** Venflon: Farbe + Größe kombiniert. */
export const VENFLON_VARIANTS: string[] = [
  'Orange 14G',
  'Grau 16G',
  'Grün 18G',
  'Pink 20G',
  'Blau 22G',
  'Gelb 24G',
  'Violett 26G',
]

export function variantsForPreset(preset: 'tubus_mm' | 'venflon'): string[] {
  return preset === 'venflon' ? VENFLON_VARIANTS : TUBUS_MM_SIZES
}

export const VARIANT_PRESET_LABELS: Record<'tubus_mm' | 'venflon', string> = {
  tubus_mm: 'Größe (mm)',
  venflon: 'Venflon',
}

export const VARIANT_PRESET_HINTS: Record<'tubus_mm' | 'venflon', string> = {
  tubus_mm: 'Tubus, Magill, Guedel, Sonden',
  venflon: 'Farbe und Größe',
}

export const MATERIAL_MODE_LABELS: Record<string, string> = {
  simple: 'Einfach (mit MHD)',
  variant: 'Mit Größe / Variante',
  no_expiry: 'Ohne MHD',
}
