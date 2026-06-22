import Tesseract from 'tesseract.js'

export interface OcrResult {
  name?: string
  expiryDate?: string  // yyyy-MM
  mgPerMl?: number
  mlPerAmpule?: number
  rawText: string
}

/**
 * Führt OCR auf einem Bild-Blob durch und versucht, Medikamentendaten zu extrahieren.
 */
export async function runOcr(imageBlob: Blob): Promise<OcrResult> {
  const url = URL.createObjectURL(imageBlob)
  try {
    const { data } = await Tesseract.recognize(url, 'deu+eng', {
      logger: () => {},
    })
    const text = data.text
    return parseOcrText(text)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function parseOcrText(text: string): OcrResult {
  const result: OcrResult = { rawText: text }

  // MHD: MM/YY, MM.YYYY, MM/YYYY, "Verwendbar bis" etc.
  const expiryPatterns = [
    /(?:exp|mhd|verwendbar bis|verw\.?\s*bis|ablauf)[:\s]*(\d{2})[./](\d{2,4})/i,
    /(\d{2})[./](\d{4})/,
    /(\d{2})[./](\d{2})(?!\d)/,
  ]
  for (const pat of expiryPatterns) {
    const m = text.match(pat)
    if (m) {
      const month = m[1]
      const yearRaw = m[2]
      const year = yearRaw.length === 2
        ? (parseInt(yearRaw) >= 0 && parseInt(yearRaw) <= 49 ? `20${yearRaw}` : `19${yearRaw}`)
        : yearRaw
      result.expiryDate = `${year}-${month.padStart(2, '0')}`
      break
    }
  }

  // mg/ml
  const mgMatch = text.match(/(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*ml/i)
  if (mgMatch) result.mgPerMl = parseFloat(mgMatch[1].replace(',', '.'))

  // ml pro Ampulle
  const mlMatch = text.match(/(\d+(?:[.,]\d+)?)\s*ml/i)
  if (mlMatch) result.mlPerAmpule = parseFloat(mlMatch[1].replace(',', '.'))

  // Name: erste nicht-leere Zeile mit ≥3 Zeichen (Heuristik)
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length >= 3)
  if (lines.length > 0) result.name = lines[0]

  return result
}
