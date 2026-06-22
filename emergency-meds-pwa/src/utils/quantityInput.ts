/** Schnellauswahl für Mengenfelder beim Hinzufügen */
export const QUICK_QUANTITY_OPTIONS = [1, 2, 3, 5] as const

/** Parst Mengen-Eingabe; leer oder ungültig → null */
export function parseQuantityInput(value: string): number | null {
  if (value.trim() === '') return null
  const n = parseInt(value, 10)
  if (!Number.isFinite(n) || n < 1) return null
  return n
}

/** Beim Verlassen des Feldes: leer/ungültig → „1“ */
export function normalizeQuantityInput(value: string): string {
  const n = parseQuantityInput(value)
  return n !== null ? String(n) : '1'
}
