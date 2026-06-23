import type { MaterialMode, VariantPreset } from '../types/material'

export interface MaterialCatalogEntry {
  name: string
  mode: MaterialMode
  variant_preset?: VariantPreset
}

const VARIANT: MaterialCatalogEntry[] = [
  { name: 'Venflon', mode: 'variant', variant_preset: 'venflon' },
  { name: 'ET-Tubus', mode: 'variant', variant_preset: 'tubus_mm' },
  { name: 'Guedel', mode: 'variant', variant_preset: 'groesse_nummer' },
  { name: 'Magill', mode: 'variant', variant_preset: 'magill_cm' },
  { name: 'Larynxmaske AuraGain', mode: 'variant', variant_preset: 'groesse_nummer' },
  { name: 'I-Gel', mode: 'variant', variant_preset: 'groesse_nummer' },
  { name: 'Spritze', mode: 'variant', variant_preset: 'spritze_ml' },
  { name: 'Spatel Macintosh', mode: 'variant', variant_preset: 'spatel_macintosh' },
  { name: 'Spatel Miller', mode: 'variant', variant_preset: 'spatel_miller' },
  { name: 'Maske', mode: 'variant', variant_preset: 'groesse_nummer' },
  { name: 'Absaugkatheter', mode: 'variant', variant_preset: 'absaugkatheter_ch' },
]

const WITH_EXPIRY: MaterialCatalogEntry[] = [
  { name: 'Elo-Mel 500ml', mode: 'simple' },
  { name: 'Gelofusin 500ml', mode: 'simple' },
  { name: 'NaCl 100ml', mode: 'simple' },
  { name: 'Infusionsbesteck', mode: 'simple' },
  { name: 'Mini-Spike', mode: 'simple' },
  { name: 'Rückschlagventil', mode: 'simple' },
  { name: 'Venflonpflaster groß', mode: 'simple' },
  { name: 'Venflonpflaster braun/quer', mode: 'simple' },
  { name: 'Rote Stöpsel', mode: 'simple' },
  { name: 'Aufziekanülen', mode: 'simple' },
  { name: '3-Weg-Hahn kurz', mode: 'simple' },
  { name: '3-Weg-Hahn lang', mode: 'simple' },
  { name: 'Stepty', mode: 'simple' },
  { name: 'Spritze i.m. Erw. (30-45mm)', mode: 'simple' },
  { name: 'Spritze i.m. Kind (15-25mm)', mode: 'simple' },
  { name: 'NaCl 10ml Omniflush', mode: 'simple' },
  { name: 'Kompressen groß', mode: 'simple' },
  { name: 'Kompressen klein', mode: 'simple' },
  { name: 'Israeli-Druckverband', mode: 'simple' },
  { name: 'Opsite-Folie', mode: 'simple' },
  { name: 'Tubusfixierung Pflaster', mode: 'simple' },
  { name: 'CO2-Detektor', mode: 'simple' },
  { name: 'PEEP-Ventil', mode: 'simple' },
]

const NO_EXPIRY: MaterialCatalogEntry[] = [
  { name: 'Ambubeutel', mode: 'no_expiry' },
  { name: 'Ambubeutel Kinder', mode: 'no_expiry' },
  { name: 'Wendel', mode: 'no_expiry' },
  { name: 'Gleitgel', mode: 'no_expiry' },
  { name: 'Griff', mode: 'no_expiry' },
  { name: 'Tubusfixierung Schlauch', mode: 'no_expiry' },
  { name: 'Blockerspritze', mode: 'no_expiry' },
  { name: 'Mandrin klein', mode: 'no_expiry' },
  { name: 'Mandrin mittel', mode: 'no_expiry' },
  { name: 'O2-Flasche', mode: 'no_expiry' },
  { name: 'O2-Schlauch', mode: 'no_expiry' },
  { name: 'Stethoskop', mode: 'no_expiry' },
  { name: 'RR Manschette', mode: 'no_expiry' },
  { name: 'Pulsoxymeter', mode: 'no_expiry' },
  { name: 'Blutzuckermessgerät', mode: 'no_expiry' },
  { name: 'Diagnostikleuchte', mode: 'no_expiry' },
  { name: 'Splint', mode: 'no_expiry' },
  { name: 'Peha Haft', mode: 'no_expiry' },
  { name: 'Peha-Haft klein', mode: 'no_expiry' },
  { name: 'Mullbinde', mode: 'no_expiry' },
  { name: 'Z-Fold Gauze', mode: 'no_expiry' },
  { name: 'Tourniquet', mode: 'no_expiry' },
  { name: 'Aludecke', mode: 'no_expiry' },
  { name: 'Dreiecktuch', mode: 'no_expiry' },
  { name: 'Rettungsschere', mode: 'no_expiry' },
  { name: 'Verbandsschere', mode: 'no_expiry' },
  { name: 'Sterile Schere', mode: 'no_expiry' },
  { name: 'Einmalskalpell', mode: 'no_expiry' },
  { name: 'Klemme', mode: 'no_expiry' },
  { name: 'Klemme unsteril', mode: 'no_expiry' },
  { name: 'Stapler', mode: 'no_expiry' },
  { name: 'Sterile Handschuhe Gr. 7,5', mode: 'no_expiry' },
  { name: 'Stauschlauch', mode: 'no_expiry' },
  { name: 'Unsterile Tupfer', mode: 'no_expiry' },
  { name: 'Alkotupfer', mode: 'no_expiry' },
  { name: 'Kugelschreiber', mode: 'no_expiry' },
  { name: 'Edding dünn', mode: 'no_expiry' },
  { name: 'Edding dick', mode: 'no_expiry' },
]

/** Notfallrucksack-Katalog (Excel-Inventar, ohne Medikamente). */
export const MATERIAL_CATALOG: MaterialCatalogEntry[] = [
  ...VARIANT,
  ...WITH_EXPIRY,
  ...NO_EXPIRY,
]
