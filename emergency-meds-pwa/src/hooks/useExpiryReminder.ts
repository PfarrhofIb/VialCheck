import { useEffect, useState } from 'react'
import { useStore } from './useStore'
import {
  getExpiringNextMonthGroups,
  markReminderShown,
  shouldShowMonthlyReminder,
  showExpirySystemNotification,
} from '../utils/expiryReminder'

export function useExpiryReminder() {
  const { medications, expiredGroups, loading } = useStore()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (loading || !shouldShowMonthlyReminder()) return

    const expiringNextMonth = getExpiringNextMonthGroups(medications)
    markReminderShown()
    setOpen(true)
    void showExpirySystemNotification(expiredGroups, expiringNextMonth)
  }, [loading, medications, expiredGroups])

  const expiringNextMonth = getExpiringNextMonthGroups(medications)

  return {
    open,
    close: () => setOpen(false),
    expired: expiredGroups,
    expiringNextMonth,
  }
}
