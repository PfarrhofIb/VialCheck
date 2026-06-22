/** Gibt den aktuellen Monat als yyyy-MM zurück */
export function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** Gibt den Folgemonat als yyyy-MM zurück */
export function nextYearMonth(): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Heute der letzte Kalendertag des Monats? */
export function isLastDayOfMonth(date = new Date()): boolean {
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  return tomorrow.getMonth() !== date.getMonth()
}

/** yyyy-MM → MM.yyyy für die Anzeige */
export function formatYearMonth(ym: string): string {
  const [year, month] = ym.split('-')
  return `${month}.${year}`
}

/** MM.yyyy → yyyy-MM für die Speicherung */
export function parseDisplayDate(display: string): string {
  const [month, year] = display.split('.')
  return `${year}-${month.padStart(2, '0')}`
}

/** Gibt zurück, ob ein Ablaufdatum (yyyy-MM) abgelaufen ist */
export function isExpired(expiryDate: string): boolean {
  return expiryDate < currentYearMonth()
}

/** Gibt zurück, ob ein Ablaufdatum innerhalb von `months` Monaten abläuft */
export function isExpiringSoon(expiryDate: string, months = 3): boolean {
  const now = new Date()
  const limit = new Date(now.getFullYear(), now.getMonth() + months, 1)
  const limitYM = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}`
  return !isExpired(expiryDate) && expiryDate <= limitYM
}

/**
 * Gibt die CSS-Klasse für ein Ablaufdatum zurück:
 * - 'text-red-600' wenn abgelaufen
 * - 'text-yellow-500' wenn bald ablaufend
 * - 'text-brand-green' sonst
 */
export function expiryColorClass(expiryDate: string): string {
  if (isExpired(expiryDate)) return 'text-red-600'
  if (isExpiringSoon(expiryDate)) return 'text-yellow-500'
  return 'text-brand-green'
}

/** Gibt den frühesten Ablaufmonat eines Medikaments zurück */
export function earliestExpiry(batches: { expiry_date: string; quantity: number }[]): string | null {
  const active = batches.filter((b) => b.quantity > 0)
  if (!active.length) return null
  return active.reduce((min, b) => (b.expiry_date < min ? b.expiry_date : min), active[0].expiry_date)
}

/** Generiert yyyy-MM Optionen für die nächsten N Monate ab jetzt */
export function generateMonthOptions(count = 36): string[] {
  const options: string[] = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return options
}
