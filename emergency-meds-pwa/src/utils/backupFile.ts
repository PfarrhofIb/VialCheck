import type { BackupFile } from '../types/backup'

export const BACKUP_FILE_EXTENSION = '.vialcheck'
export const BACKUP_MIME_TYPE = 'application/vnd.vialcheck+backup'

export function backupFilename(date = new Date()): string {
  const d = date.toISOString().slice(0, 10)
  return `vialcheck-backup-${d}${BACKUP_FILE_EXTENSION}`
}

function backupJson(backup: BackupFile): string {
  return JSON.stringify(backup, null, 2)
}

export function backupFile(backup: BackupFile): File {
  const filename = backupFilename(new Date(backup.exportedAt))
  return new File([backupJson(backup)], filename, { type: BACKUP_MIME_TYPE })
}

/** Speicherort wählen (Desktop) oder Download-Ordner (Handy). */
export async function downloadBackupFile(backup: BackupFile): Promise<void> {
  const filename = backupFilename(new Date(backup.exportedAt))
  const json = backupJson(backup)

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (
        window as Window & {
          showSaveFilePicker: (options: {
            suggestedName: string
            types: { description: string; accept: Record<string, string[]> }[]
          }) => Promise<FileSystemFileHandle>
        }
      ).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'VialCheck Backup',
            accept: { [BACKUP_MIME_TYPE]: [BACKUP_FILE_EXTENSION] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(json)
      await writable.close()
      return
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
    }
  }

  const blob = new Blob([json], { type: BACKUP_MIME_TYPE })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** System-Teilen-Dialog (Drive, E-Mail, Messenger, …). */
export async function shareBackupFile(backup: BackupFile): Promise<void> {
  const file = backupFile(backup)
  if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
    throw new Error('Teilen wird auf diesem Gerät nicht unterstützt.')
  }
  try {
    await navigator.share({ files: [file], title: 'VialCheck Backup' })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    throw err
  }
}

export function canShareBackupFile(): boolean {
  if (!navigator.share || !navigator.canShare) return false
  try {
    const probe = new File([''], `probe${BACKUP_FILE_EXTENSION}`, { type: BACKUP_MIME_TYPE })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}
