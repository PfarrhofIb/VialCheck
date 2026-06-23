import { useEffect, useState } from 'react'
import { searchStorageLocations } from '../db/storageLocationQueries'

interface StorageLocationFieldProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export default function StorageLocationField({
  value,
  onChange,
  label = 'Einsortiert in',
}: StorageLocationFieldProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void searchStorageLocations(value).then((items) => {
      if (!cancelled) setSuggestions(items)
    })
    return () => {
      cancelled = true
    }
  }, [value, open])

  const filtered = suggestions.filter(
    (s) => s.toLowerCase() !== value.trim().toLowerCase(),
  )

  return (
    <div className="relative flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
        placeholder="z. B. Modultasche Trauma, Außentasche"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-30 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg"
          role="listbox"
        >
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                role="option"
                className="w-full text-left px-3 py-2.5 text-sm text-gray-900 hover:bg-brand-navy-50 border-b border-gray-50 last:border-0"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(name)
                  setOpen(false)
                }}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
