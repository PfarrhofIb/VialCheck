import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useStore } from './hooks/useStore'
import { useExpiryReminder } from './hooks/useExpiryReminder'
import ExpiryReminderModal from './components/ExpiryReminderModal'
import InventoryPage from './pages/InventoryPage'
import RefillPage from './pages/RefillPage'

function TabBar() {
  const { refillItems, expiredGroups, expiringSoonGroups } = useStore()
  const badgeCount = refillItems.length + expiredGroups.length + expiringSoonGroups.length

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 pt-2 pb-1 flex-1 text-xs font-medium transition-colors ${
      isActive ? 'text-brand-navy' : 'text-gray-500'
    }`

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 grid grid-cols-3 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <NavLink to="/" end className={tabClass}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Bestand
      </NavLink>

      <div className="flex items-center justify-center py-1 pointer-events-none" aria-hidden>
        <img src="/icons/icon-192.png" alt="" className="w-10 h-10 rounded-xl" />
      </div>

      <NavLink to="/nachfullen" className={tabClass}>
        <div className="relative">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-navy text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </div>
        Nachfüllen
      </NavLink>
    </nav>
  )
}

function AppShell() {
  const refresh = useStore((s) => s.refresh)
  const reminder = useExpiryReminder()
  useEffect(() => { refresh() }, [refresh])

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
      <Routes>
        <Route path="/" element={<InventoryPage />} />
        <Route path="/nachfullen" element={<RefillPage />} />
        <Route path="/scanner" element={<Navigate to="/" replace />} />
      </Routes>
      <TabBar />
      <ExpiryReminderModal
        open={reminder.open}
        onClose={reminder.close}
        expired={reminder.expired}
        expiringNextMonth={reminder.expiringNextMonth}
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
