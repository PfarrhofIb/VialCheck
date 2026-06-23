import type { Medication, MedicationBatch } from '../types'
import type { MaterialExpiryGroup } from '../db/materialQueries'
import { getPrimaryName } from './medicationDisplay'
import { formatYearMonth, isLastDayOfMonth, nextYearMonth } from './expiry'

export type ExpiryGroup = { medication: Medication; batches: MedicationBatch[] }

const STORAGE_PREFIX = 'expiry-reminder-shown-'

export function reminderStorageKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${STORAGE_PREFIX}${y}-${m}-${d}`
}

export function wasReminderShownToday(): boolean {
  try {
    return localStorage.getItem(reminderStorageKey()) === '1'
  } catch {
    return false
  }
}

export function markReminderShown(): void {
  try {
    localStorage.setItem(reminderStorageKey(), '1')
  } catch {
    /* private mode / quota */
  }
}

export function shouldShowMonthlyReminder(date = new Date()): boolean {
  return isLastDayOfMonth(date) && !wasReminderShownToday()
}

export function getExpiringNextMonthGroups(
  medications: Array<{ batches: MedicationBatch[] } & Medication>,
): ExpiryGroup[] {
  const target = nextYearMonth()
  const groups: ExpiryGroup[] = []
  for (const med of medications) {
    const batches = med.batches.filter((b) => b.quantity > 0 && b.expiry_date === target)
    if (batches.length) groups.push({ medication: med, batches })
  }
  return groups.sort((a, b) =>
    getPrimaryName(a.medication).localeCompare(getPrimaryName(b.medication), 'de'),
  )
}

export function buildNotificationSummary(
  expired: ExpiryGroup[],
  expiringNextMonth: ExpiryGroup[],
  expiredMaterials: MaterialExpiryGroup[] = [],
  expiringNextMonthMaterials: MaterialExpiryGroup[] = [],
): { title: string; body: string } {
  const parts: string[] = []
  const expiredCount = expired.length + expiredMaterials.length
  const nextMonthCount = expiringNextMonth.length + expiringNextMonthMaterials.length
  if (expiredCount) {
    parts.push(`${expiredCount} abgelaufen`)
  }
  if (nextMonthCount) {
    parts.push(`${nextMonthCount} laufen ${formatYearMonth(nextYearMonth())} ab`)
  }
  if (!parts.length) {
    return {
      title: 'MHD-Monatsübersicht',
      body: 'Keine abgelaufenen Einträge, nichts läuft nächsten Monat ab.',
    }
  }
  return {
    title: 'MHD-Monatsübersicht',
    body: parts.join(' · '),
  }
}

export async function showExpirySystemNotification(
  expired: ExpiryGroup[],
  expiringNextMonth: ExpiryGroup[],
  expiredMaterials: MaterialExpiryGroup[] = [],
  expiringNextMonthMaterials: MaterialExpiryGroup[] = [],
): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const { title, body } = buildNotificationSummary(
    expired,
    expiringNextMonth,
    expiredMaterials,
    expiringNextMonthMaterials,
  )
  try {
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: reminderStorageKey(),
    })
  } catch {
    new Notification(title, { body, icon: '/icons/icon-192.png', tag: reminderStorageKey() })
  }
}
