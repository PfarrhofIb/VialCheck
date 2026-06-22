const MONTHS = [
  { value: '01', label: 'Januar' },
  { value: '02', label: 'Februar' },
  { value: '03', label: 'März' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Dezember' },
]

interface MonthPickerProps {
  value: string        // yyyy-MM
  onChange: (value: string) => void
  label?: string
  required?: boolean
  includesPast?: boolean
}

export default function MonthPicker({ value, onChange, label, required, includesPast }: MonthPickerProps) {
  const now = new Date()
  const currentYear = now.getFullYear()

  const [yearStr, monthStr] = value ? value.split('-') : ['', '']

  const startYear = includesPast ? currentYear - 2 : currentYear
  const endYear = currentYear + 5
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)

  function handleMonth(m: string) {
    const y = yearStr || String(currentYear)
    onChange(m ? `${y}-${m}` : '')
  }

  function handleYear(y: string) {
    const m = monthStr || ''
    onChange(y && m ? `${y}-${m}` : '')
  }

  const selectClass =
    'border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-red-500 w-full'

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={monthStr ?? ''}
          onChange={(e) => handleMonth(e.target.value)}
          required={required}
          className={selectClass}
        >
          <option value="">Monat</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <select
          value={yearStr ?? ''}
          onChange={(e) => handleYear(e.target.value)}
          required={required}
          className={selectClass}
        >
          <option value="">Jahr</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
