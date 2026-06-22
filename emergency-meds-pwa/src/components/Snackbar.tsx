import { useEffect } from 'react'

interface SnackbarProps {
  message: string | null
  onDismiss: () => void
}

export default function Snackbar({ message, onDismiss }: SnackbarProps) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2.5 rounded-full shadow-lg z-50 max-w-xs text-center"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {message}
    </div>
  )
}
