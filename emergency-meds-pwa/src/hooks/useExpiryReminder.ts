import { useEffect, useState } from 'react'
import { useStore } from './useStore'
import { getExpiringNextMonthMaterialGroups } from '../db/materialQueries'
import {
  getExpiringNextMonthGroups,
  markReminderShown,
  shouldShowMonthlyReminder,
  showExpirySystemNotification,
} from '../utils/expiryReminder'

export function useExpiryReminder() {
  const { medications, materials, expiredGroups, expiredMaterialGroups, loading } = useStore()
  const [open, setOpen] = useState(false)

  const expiringNextMonth = getExpiringNextMonthGroups(medications)
  const expiringNextMonthMaterials = getExpiringNextMonthMaterialGroups(materials)

  useEffect(() => {
    if (loading || !shouldShowMonthlyReminder()) return

    markReminderShown()
    setOpen(true)
    void showExpirySystemNotification(
      expiredGroups,
      expiringNextMonth,
      expiredMaterialGroups,
      expiringNextMonthMaterials,
    )
  }, [loading, expiredGroups, expiredMaterialGroups, expiringNextMonth, expiringNextMonthMaterials])

  return {
    open,
    close: () => setOpen(false),
    expired: expiredGroups,
    expiringNextMonth,
    expiredMaterials: expiredMaterialGroups,
    expiringNextMonthMaterials,
  }
}
