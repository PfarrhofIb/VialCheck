import type { Medication } from '../types'
import { getPrimaryName, getSecondaryName } from '../utils/medicationDisplay'

interface MedicationNameDisplayProps {
  med: Pick<Medication, 'handelsname' | 'wirkstoffname' | 'display_name'>
  primaryClassName?: string
  secondaryClassName?: string
}

export default function MedicationNameDisplay({
  med,
  primaryClassName = 'font-semibold text-gray-900 truncate',
  secondaryClassName = 'text-xs text-gray-500 truncate mt-0.5',
}: MedicationNameDisplayProps) {
  const primary = getPrimaryName(med)
  const secondary = getSecondaryName(med)

  return (
    <div className="min-w-0">
      <p className={primaryClassName}>{primary}</p>
      {secondary && <p className={secondaryClassName}>{secondary}</p>}
    </div>
  )
}
