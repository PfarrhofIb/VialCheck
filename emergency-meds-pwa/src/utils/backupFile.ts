import type { BackupFile } from '../types/backup'

export function backupFilename(date = new Date()): string {
  const d = date.toISOString().slice(0, 10)
  return `vialcheck-backup-${d}.json`
}

export async function saveBackupFile(backup: BackupFile): Promise<void> {
  const json = JSON.stringify(backup, null, 2)
  const filename = backupFilename(new Date(backup.exportedAt))
  const file = new File([json], filename, { type: 'application/json' })

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'VialCheck Backup' })
      return
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
    }
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
