import type { VariantPreset } from '../types/material'
import { variantsForPreset, VARIANT_PRESET_LABELS } from '../utils/materialVariants'

interface MaterialVariantPickerProps {
  preset: VariantPreset
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
}

export default function MaterialVariantPicker({
  preset,
  value,
  onChange,
  label,
  required,
}: MaterialVariantPickerProps) {
  const options = variantsForPreset(preset)
  const displayLabel = label ?? VARIANT_PRESET_LABELS[preset]

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {displayLabel}
        {required && <span className="text-brand-navy"> *</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="border border-gray-300 rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy"
      >
        <option value="">Bitte wählen…</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
