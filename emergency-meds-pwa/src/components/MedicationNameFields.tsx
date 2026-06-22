import type { DisplayNameField } from '../utils/medicationDisplay'

interface MedicationNameFieldsProps {
  handelsname: string
  wirkstoffname: string
  displayName: DisplayNameField
  onHandelsnameChange: (value: string) => void
  onWirkstoffnameChange: (value: string) => void
  onDisplayNameChange: (value: DisplayNameField) => void
}

export default function MedicationNameFields({
  handelsname,
  wirkstoffname,
  displayName,
  onHandelsnameChange,
  onWirkstoffnameChange,
  onDisplayNameChange,
}: MedicationNameFieldsProps) {
  const inputClass =
    'flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy'

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Handelsname</label>
        <div className="flex items-center gap-2">
          <input
            value={handelsname}
            onChange={(e) => onHandelsnameChange(e.target.value)}
            className={inputClass}
            placeholder="z.B. Dibondrin"
          />
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
          <input
            value={wirkstoffname}
            onChange={(e) => onWirkstoffnameChange(e.target.value)}
            className={inputClass}
            placeholder="z.B. Dimetindenmaleat"
          />
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
        Mindestens ein Name erforderlich. „Überschrift“ = große Anzeige in der Liste.
      </p>
    </div>
  )
}
