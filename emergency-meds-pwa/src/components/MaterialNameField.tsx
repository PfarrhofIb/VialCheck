import { useMemo, useState } from 'react'
import type { MaterialMode, VariantPreset } from '../types/material'
import {
  buildMaterialSuggestionPool,
  formatMaterialSuggestionDetail,
  searchMaterialSuggestions,
  type MaterialSuggestion,
} from '../utils/materialSuggestions'

interface MaterialNameFieldProps {
  name: string
  onNameChange: (value: string) => void
  onSuggestionSelect: (suggestion: MaterialSuggestion) => void
  localMaterials?: Array<{ name: string; mode: MaterialMode; variant_preset?: VariantPreset }>
}

function SuggestionDropdown({
  suggestions,
  onSelect,
}: {
  suggestions: MaterialSuggestion[]
  onSelect: (s: MaterialSuggestion) => void
}) {
  if (!suggestions.length) return null

  return (
    <ul
      className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg"
      role="listbox"
    >
      {suggestions.map((s) => (
        <li key={`${s.name}|${s.source}`}>
          <button
            type="button"
            role="option"
            className="w-full text-left px-3 py-2.5 hover:bg-brand-navy-50 border-b border-gray-50 last:border-0"
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(s)
            }}
          >
            <span className="block text-sm font-medium text-gray-900">{s.name}</span>
            <span className="block text-xs text-gray-500 mt-0.5">
              {formatMaterialSuggestionDetail(s)}
              {s.source === 'local' ? ' · eigener Bestand' : ''}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function MaterialNameField({
  name,
  onNameChange,
  onSuggestionSelect,
  localMaterials = [],
}: MaterialNameFieldProps) {
  const [focused, setFocused] = useState(false)
  const pool = useMemo(() => buildMaterialSuggestionPool(localMaterials), [localMaterials])
  const suggestions = useMemo(
    () => (focused ? searchMaterialSuggestions(name, pool) : []),
    [focused, name, pool],
  )

  return (
    <div className="relative flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
        placeholder="Material suchen oder frei eingeben…"
        autoComplete="off"
        required
      />
      <SuggestionDropdown
        suggestions={suggestions}
        onSelect={(s) => {
          onSuggestionSelect(s)
          setFocused(false)
        }}
      />
    </div>
  )
}
