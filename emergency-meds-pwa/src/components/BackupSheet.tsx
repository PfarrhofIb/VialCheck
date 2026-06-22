import { useRef, useState } from 'react'
import { exportBackup, importBackup, parseBackupFile } from '../db/backup'
import { saveBackupFile } from '../utils/backupFile'
import { useStore } from '../hooks/useStore'
import BottomSheet from './BottomSheet'

interface BackupSheetProps {
  open: boolean
  onClose: () => void
}

export default function BackupSheet({ open, onClose }: BackupSheetProps) {
  const refresh = useStore((s) => s.refresh)
  const fileRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleExport() {
    setExporting(true)
    setMessage(null)
    try {
      const backup = await exportBackup()
      await saveBackupFile(backup)
      setMessage({
        type: 'ok',
        text: `Backup erstellt (${backup.medications.length} Medikamente).`,
      })
    } catch {
      setMessage({ type: 'err', text: 'Export fehlgeschlagen.' })
    } finally {
      setExporting(false)
    }
  }

  async function handleImportFile(file: File) {
    setImporting(true)
    setMessage(null)
    try {
      const text = await file.text()
      const backup = parseBackupFile(text)
      const date = new Date(backup.exportedAt).toLocaleString('de-DE')
      const ok = confirm(
        `Backup vom ${date} importieren?\n\n` +
          `${backup.medications.length} Medikamente, ` +
          `${backup.medication_batches.length} Chargen\n\n` +
          `Alle aktuellen Daten auf diesem Gerät werden ersetzt.`,
      )
      if (!ok) return

      await importBackup(backup)
      await refresh()
      setMessage({ type: 'ok', text: 'Backup erfolgreich importiert.' })
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : 'Import fehlgeschlagen.',
      })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const footer = (
    <button
      type="button"
      onClick={onClose}
      className="w-full py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
    >
      Schließen
    </button>
  )

  return (
    <BottomSheet open={open} onClose={onClose} title="Datensicherung" footer={footer}>
      <p className="text-sm text-gray-500 mb-4">
        Sichere alle Medikamente, Chargen, Nachfüllliste und Fotos als JSON-Datei.
        Die Datei kann z.B. in Google Drive gespeichert werden.
      </p>

      {message && (
        <div
          className={`mb-4 text-sm px-3 py-2 rounded-lg ${
            message.type === 'ok'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || importing}
          className="w-full flex items-center justify-center gap-2 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? 'Export läuft…' : 'Backup exportieren'}
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={exporting || importing}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {importing ? 'Import läuft…' : 'Backup importieren'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImportFile(f)
          }}
        />
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Beim Export auf dem Handy: „Teilen“ → Google Drive oder Dateien-App wählen.
      </p>
    </BottomSheet>
  )
}
