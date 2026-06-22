import { useMemo, useRef, useState } from 'react'
import type { DisplayNameField } from '../utils/medicationDisplay'
import {
  buildSuggestionPool,
  formatSuggestionDetail,
  formatSuggestionLabel,
  searchMedicationSuggestions,
  type MedicationSuggestion,
} from '../utils/medicationSuggestions'

type LocalMedication = Pick<
  MedicationSuggestion,
  'handelsname' | 'wirkstoffname' | 'display_name' | 'ml_per_ampule' | 'mg_per_ml'
>

interface MedicationNameFieldsProps {
  handelsname: string
  wirkstoffname: string
  displayName: DisplayNameField
  onHandelsnameChange: (value: string) => void
  onWirkstoffnameChange: (value: string) => void
  onDisplayNameChange: (value: DisplayNameField) => void
  localMedications?: LocalMedication[]
  onSuggestionSelect?: (suggestion: MedicationSuggestion) => void
}

type ActiveField = 'handelsname' | 'wirkstoffname'

function SuggestionDropdown({
  suggestions,
  onSelect,
}: {
  suggestions: MedicationSuggestion[]
  onSelect: (s: MedicationSuggestion) => void
}) {
  if (!suggestions.length) return null

  return (
    <ul
      className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg"
      role="listbox"
    >
      {suggestions.map((s) => {
        const detail = formatSuggestionDetail(s)
        return (
          <li key={`${s.handelsname}|${s.wirkstoffname}|${s.source}`}>
            <button
              type="button"
              role="option"
              className="w-full text-left px-3 py-2.5 hover:bg-brand-navy-50 border-b border-gray-50 last:border-0"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(s)
              }}
            >
              <span className="block text-sm font-medium text-gray-900">{formatSuggestionLabel(s)}</span>
              {detail && <span className="block text-xs text-gray-500 mt-0.5">{detail}</span>}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default function MedicationNameFields({
  handelsname,
  wirkstoffname,
  displayName,
  onHandelsnameChange,
  onWirkstoffnameChange,
  onDisplayNameChange,
  localMedications = [],
  onSuggestionSelect,
}: MedicationNameFieldsProps) {
  const [activeField, setActiveField] = useState<ActiveField | null>(null)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pool = useMemo(() => buildSuggestionPool(localMedications), [localMedications])

  const handelsnameSuggestions = useMemo(
    () => (activeField === 'handelsname' ? searchMedicationSuggestions(handelsname, pool) : []),
    [activeField, handelsname, pool],
  )

  const wirkstoffnameSuggestions = useMemo(
    () => (activeField === 'wirkstoffname' ? searchMedicationSuggestions(wirkstoffname, pool) : []),
    [activeField, wirkstoffname, pool],
  )

  const inputClass =
    'flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy'

  function handleFocus(field: ActiveField) {
    if (blurTimer.current) clearTimeout(blurTimer.current)
    setActiveField(field)
  }

  function handleBlur() {
    blurTimer.current = setTimeout(() => setActiveField(null), 150)
  }

  function applySuggestion(s: MedicationSuggestion) {
    onHandelsnameChange(s.handelsname)
    onWirkstoffnameChange(s.wirkstoffname)
    onDisplayNameChange(s.display_name)
    onSuggestionSelect?.(s)
    setActiveField(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Handelsname</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              value={handelsname}
              onChange={(e) => onHandelsnameChange(e.target.value)}
              onFocus={() => handleFocus('handelsname')}
              onBlur={handleBlur}
              className={`w-full ${inputClass}`}
              placeholder="z.B. Dibondrin"
              autoComplete="off"
            />
            <SuggestionDropdown suggestions={handelsnameSuggestions} onSelect={applySuggestion} />
          </div>
          <label className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer">
            <input
              type="radio"
              name="displayName"
              checked={displayName === 'handelsname'}
              onChange={() => onDisplayNameChange('handelsname')}
              className="w-4 h-4 accent-brand-navy"
            />
            <span className="text-[10px] text-gray-500 leading-tight text-center w-14">Überschrift</span>
          </label>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Wirkstoffname</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              value={wirkstoffname}
              onChange={(e) => onWirkstoffnameChange(e.target.value)}
              onFocus={() => handleFocus('wirkstoffname')}
              onBlur={handleBlur}
              className={`w-full ${inputClass}`}
              placeholder="z.B. Dimetindenmaleat"
              autoComplete="off"
            />
            <SuggestionDropdown suggestions={wirkstoffnameSuggestions} onSelect={applySuggestion} />
          </div>
          <label className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer">
            <input
              type="radio"
              name="displayName"
              checked={displayName === 'wirkstoffname'}
              onChange={() => onDisplayNameChange('wirkstoffname')}
              className="w-4 h-4 accent-brand-navy"
            />
            <span className="text-[10px] text-gray-500 leading-tight text-center w-14">Überschrift</span>
          </label>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Mindestens ein Name erforderlich. Beim Tippen erscheinen Vorschläge aus dem Notfallkatalog.
      </p>
    </div>
  )
}
