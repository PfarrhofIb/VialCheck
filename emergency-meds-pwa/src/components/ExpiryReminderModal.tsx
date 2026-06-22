import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from './Modal'
import MedicationNameDisplay from './MedicationNameDisplay'
import { formatYearMonth, nextYearMonth } from '../utils/expiry'
import type { ExpiryGroup } from '../utils/expiryReminder'

interface ExpiryReminderModalProps {
  open: boolean
  onClose: () => void
  expired: ExpiryGroup[]
  expiringNextMonth: ExpiryGroup[]
}

function GroupList({ groups, emptyText }: { groups: ExpiryGroup[]; emptyText: string }) {
  if (!groups.length) {
    return <p className="text-sm text-gray-500 py-1">{emptyText}</p>
  }
  return (
    <ul className="space-y-2">
      {groups.map(({ medication, batches }) => {
        const total = batches.reduce((s, b) => s + b.quantity, 0)
        const months = [...new Set(batches.map((b) => b.expiry_date))].sort()
        return (
          <li key={medication.id} className="rounded-xl bg-gray-50 px-3 py-2">
            <MedicationNameDisplay med={medication} primaryClassName="font-medium text-gray-900" />
            <p className="text-sm text-gray-600 mt-0.5">
              {total} Stück · MHD {months.map(formatYearMonth).join(', ')}
            </p>
          </li>
        )
      })}
    </ul>
  )
}

export default function ExpiryReminderModal({
  open,
  onClose,
  expired,
  expiringNextMonth,
}: ExpiryReminderModalProps) {
  const [notifState, setNotifState] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  const canNotify = typeof window !== 'undefined' && 'Notification' in window
  const permission = canNotify ? Notification.permission : 'denied'

  const handleEnableNotifications = async () => {
    if (!canNotify) return
    setNotifState('requesting')
    const result = await Notification.requestPermission()
    setNotifState(result === 'granted' ? 'granted' : 'denied')
  }

  const nextLabel = formatYearMonth(nextYearMonth())
  const hasIssues = expired.length > 0 || expiringNextMonth.length > 0

  return (
    <Modal open={open} onClose={onClose} title="Monatsübersicht MHD">
      <p className="text-sm text-gray-600 mb-4">
        Heute ist der letzte Tag des Monats — hier die Übersicht für deinen Notfallbestand.
      </p>

      <section className="mb-4">
        <h3 className="text-sm font-semibold text-red-600 mb-2">Abgelaufen</h3>
        <GroupList groups={expired} emptyText="Keine abgelaufenen Medikamente im Bestand." />
      </section>

      <section className="mb-4">
        <h3 className="text-sm font-semibold text-yellow-600 mb-2">
          Läuft im {nextLabel} ab
        </h3>
        <GroupList
          groups={expiringNextMonth}
          emptyText={`Nichts läuft im ${nextLabel} ab.`}
        />
      </section>

      {hasIssues && (
        <Link
          to="/nachfullen"
          onClick={onClose}
          className="block text-center text-sm font-medium text-red-600 mb-4"
        >
          Zum Tab „Nachfüllen“ →
        </Link>
      )}

      {canNotify && permission === 'default' && notifState !== 'granted' && (
        <div className="rounded-xl bg-red-50 px-3 py-3 mb-4">
          <p className="text-xs text-gray-700 mb-2">
            Mit Benachrichtigungen siehst du diese Übersicht auch als System-Hinweis — wenn du die
            App am Monatsende öffnest (ohne Server, kein Hintergrund-Push).
          </p>
          <button
            type="button"
            onClick={handleEnableNotifications}
            disabled={notifState === 'requesting'}
            className="w-full py-2 rounded-xl bg-red-600 text-white text-sm font-medium disabled:opacity-60"
          >
            {notifState === 'requesting' ? 'Wird angefragt…' : 'Benachrichtigungen erlauben'}
          </button>
          {notifState === 'denied' && (
            <p className="text-xs text-red-700 mt-2">Abgelehnt — in den Browser-Einstellungen änderbar.</p>
          )}
        </div>
      )}

      {canNotify && permission === 'granted' && (
        <p className="text-xs text-gray-500 mb-4">
          System-Benachrichtigung wurde für heute gesendet (falls die App geöffnet wurde).
        </p>
      )}

      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-800 text-sm font-medium"
      >
        Schließen
      </button>
    </Modal>
  )
}
