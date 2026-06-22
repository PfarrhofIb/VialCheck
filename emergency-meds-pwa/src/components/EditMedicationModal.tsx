import { useState, useEffect, useRef } from 'react'
import type { MedicationWithBatches } from '../types'
import { updateMedication, deleteMedication, savePhoto, getPhoto, deletePhoto } from '../db/queries'
import { useStore } from '../hooks/useStore'
import Modal from './Modal'
import MedicationNameFields from './MedicationNameFields'
import { runOcr } from '../utils/ocr'
import { getPrimaryName, hasAnyName, type DisplayNameField } from '../utils/medicationDisplay'

interface EditMedicationModalProps {
  med: MedicationWithBatches | null
  onClose: () => void
}

export default function EditMedicationModal({ med, onClose }: EditMedicationModalProps) {
  const refresh = useStore((s) => s.refresh)
  const [handelsname, setHandelsname] = useState('')
  const [wirkstoffname, setWirkstoffname] = useState('')
  const [displayName, setDisplayName] = useState<DisplayNameField>('handelsname')
  const [mlPerAmpule, setMlPerAmpule] = useState('')
  const [mgPerMl, setMgPerMl] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!med) return
    setHandelsname(med.handelsname ?? '')
    setWirkstoffname(med.wirkstoffname ?? '')
    setDisplayName(med.display_name ?? 'handelsname')
    setMlPerAmpule(med.ml_per_ampule?.toString() ?? '')
    setMgPerMl(med.mg_per_ml?.toString() ?? '')
    setPhotoUrl(null)
    if (med.photo_blob_id) {
      getPhoto(med.photo_blob_id).then((blob) => {
        if (blob) setPhotoUrl(URL.createObjectURL(blob))
      })
    }
  }, [med])

  if (!med) return null

  const canSave = hasAnyName(handelsname, wirkstoffname)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    setLoading(true)
    try {
      await updateMedication(med!.id!, {
        handelsname: handelsname.trim(),
        wirkstoffname: wirkstoffname.trim(),
        display_name: displayName,
        ml_per_ampule: mlPerAmpule ? parseFloat(mlPerAmpule) : undefined,
        mg_per_ml: mgPerMl ? parseFloat(mgPerMl) : undefined,
      })
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handlePhotoUpload(file: File) {
    setOcrLoading(true)
    try {
      const photoId = await savePhoto(file)
      await updateMedication(med!.id!, { photo_blob_id: photoId })
      setPhotoUrl(URL.createObjectURL(file))
      const result = await runOcr(file)
      if (result.name && !handelsname) setHandelsname(result.name)
      if (result.mlPerAmpule && !mlPerAmpule) setMlPerAmpule(result.mlPerAmpule.toString())
      if (result.mgPerMl && !mgPerMl) setMgPerMl(result.mgPerMl.toString())
      await refresh()
    } finally {
      setOcrLoading(false)
    }
  }

  async function handleDeletePhoto() {
    if (!med?.photo_blob_id) return
    await deletePhoto(med.photo_blob_id)
    await updateMedication(med.id!, { photo_blob_id: undefined })
    setPhotoUrl(null)
    await refresh()
  }

  async function handleDelete() {
    if (!confirm(`„${getPrimaryName(med!)}" wirklich löschen?`)) return
    await deleteMedication(med!.id!)
    await refresh()
    onClose()
  }

  return (
    <Modal open={!!med} onClose={onClose} title="Medikament bearbeiten">
      <form onSubmit={handleSave} className="space-y-4">
        <MedicationNameFields
          handelsname={handelsname}
          wirkstoffname={wirkstoffname}
          displayName={displayName}
          onHandelsnameChange={setHandelsname}
          onWirkstoffnameChange={setWirkstoffname}
          onDisplayNameChange={setDisplayName}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">ml/Ampulle</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={mlPerAmpule}
              onChange={(e) => setMlPerAmpule(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
              placeholder="z.B. 5"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">mg/ml</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={mgPerMl}
              onChange={(e) => setMgPerMl(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
              placeholder="z.B. 10"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Ampullen-Foto</p>
          {photoUrl ? (
            <div className="relative w-24 h-24">
              <img src={photoUrl} alt="Ampulle" className="w-24 h-24 object-cover rounded-xl" />
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="absolute -top-1 -right-1 bg-brand-navy text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={ocrLoading}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-brand-navy border border-brand-navy/30 rounded-xl px-3 py-2 hover:bg-brand-navy-50"
              >
                {ocrLoading ? 'OCR läuft…' : '📷 Foto aufnehmen'}
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={ocrLoading}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-gray-600 border border-gray-300 rounded-xl px-3 py-2 hover:bg-gray-50"
              >
                Galerie
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handlePhotoUpload(f)
              e.target.value = ''
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handlePhotoUpload(f)
              e.target.value = ''
            }}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || !canSave}
            className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl"
          >
            {loading ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="w-full text-red-600 text-sm py-2"
        >
          Medikament löschen
        </button>
      </form>
    </Modal>
  )
}
