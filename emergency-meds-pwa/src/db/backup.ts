import { db } from './schema'
import type { Medication, MedicationBatch, RefillItem, Photo, OrderMarker } from '../types'
import { normalizeMedicationFields } from '../utils/medicationDisplay'
import { BACKUP_VERSION, type BackupFile, type BackupPhoto } from '../types/backup'

async function blobToBase64(blob: Blob): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const [, data] = result.split(',')
      resolve({ data, mimeType: blob.type || 'image/jpeg' })
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(data: string, mimeType: string): Blob {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export async function exportBackup(): Promise<BackupFile> {
  const [medications, medication_batches, refill_list, photos, order_markers] = await Promise.all([
    db.medications.toArray(),
    db.medication_batches.toArray(),
    db.refill_list.toArray(),
    db.photos.toArray(),
    db.order_markers.toArray(),
  ])

  const backupPhotos: BackupPhoto[] = await Promise.all(
    photos.map(async (p) => {
      const { data, mimeType } = await blobToBase64(p.blob)
      return { id: p.id!, data, mimeType }
    }),
  )

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    medications,
    medication_batches,
    refill_list,
    photos: backupPhotos,
    order_markers,
  }
}

function validateBackup(data: unknown): data is BackupFile {
  if (!data || typeof data !== 'object') return false
  const b = data as BackupFile
  return (
    b.version === BACKUP_VERSION &&
    typeof b.exportedAt === 'string' &&
    Array.isArray(b.medications) &&
    Array.isArray(b.medication_batches) &&
    Array.isArray(b.refill_list) &&
    Array.isArray(b.photos)
  )
}

export async function importBackup(file: BackupFile): Promise<void> {
  if (!validateBackup(file)) {
    throw new Error('Ungültige Backup-Datei')
  }

  const photos: Photo[] = file.photos.map((p) => ({
    id: p.id,
    blob: base64ToBlob(p.data, p.mimeType),
  }))

  const medications: Medication[] = file.medications.map((raw) => {
    const names = normalizeMedicationFields(raw as unknown as Record<string, unknown>)
    return { ...raw, ...names } as Medication
  })

  await db.transaction('rw', db.medications, db.medication_batches, db.refill_list, db.photos, db.order_markers, async () => {
    await Promise.all([
      db.medications.clear(),
      db.medication_batches.clear(),
      db.refill_list.clear(),
      db.photos.clear(),
      db.order_markers.clear(),
    ])

    if (medications.length) await db.medications.bulkPut(medications)
    if (file.medication_batches.length) await db.medication_batches.bulkPut(file.medication_batches as MedicationBatch[])
    if (file.refill_list.length) await db.refill_list.bulkPut(file.refill_list as RefillItem[])
    if (photos.length) await db.photos.bulkPut(photos)
    if (file.order_markers?.length) await db.order_markers.bulkPut(file.order_markers as OrderMarker[])
  })
}

export function parseBackupFile(text: string): BackupFile {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Datei ist kein gültiges JSON')
  }
  if (!validateBackup(parsed)) {
    throw new Error('Ungültige oder inkompatible Backup-Datei')
  }
  return parsed
}
