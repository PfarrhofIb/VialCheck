/**
 * Parst GS1-DataMatrix / GS1-128 AI-Felder aus einem Roh-String.
 * Unterstützt AI 01 (GTIN/PZN) und AI 17 (Ablaufdatum YYMMDD).
 */
export function parseGS1(raw: string): { gtin?: string; expiryDate?: string } {
  const result: { gtin?: string; expiryDate?: string } = {}

  // Normalisierung: Kontrollzeichen entfernen
  const clean = raw.replace(/[\x00-\x1F]/g, '')

  // AI 01 (14-stellige GTIN)
  const gtinMatch = clean.match(/(?:^|\(01\)|01)(\d{14})/)
  if (gtinMatch) result.gtin = gtinMatch[1]

  // AI 17 (MHD: YYMMDD)
  const expiryMatch = clean.match(/(?:\(17\)|17)(\d{6})/)
  if (expiryMatch) {
    const raw6 = expiryMatch[1]
    const year = parseInt(raw6.slice(0, 2), 10)
    const month = raw6.slice(2, 4)
    const fullYear = year >= 0 && year <= 49 ? 2000 + year : 1900 + year
    result.expiryDate = `${fullYear}-${month}`
  }

  return result
}

/** Mögliche Barcode-Schlüssel für DB-Lookup (Rohwert + GTIN-Varianten). */
export function barcodeLookupKeys(raw: string): string[] {
  const keys = new Set<string>()
  const trimmed = raw.trim()
  if (trimmed) keys.add(trimmed)
  const { gtin } = parseGS1(raw)
  if (gtin) {
    keys.add(gtin)
    const stripped = gtin.replace(/^0+/, '')
    if (stripped) keys.add(stripped)
  }
  return [...keys]
}

/** Bevorzugter Barcode zum Speichern (GTIN falls aus GS1 erkennbar). */
export function preferredBarcode(raw: string): string {
  const { gtin } = parseGS1(raw)
  return gtin ?? raw.trim()
}
