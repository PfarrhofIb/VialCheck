import { useState, useEffect, useRef } from 'react'
import type { MaterialWithLots } from '../types/material'
import {
  updateMaterial,
  deleteMaterial,
  updateMaterialLot,
  deleteMaterialLot,
} from '../db/materialQueries'
import { savePhoto, getPhoto, deletePhoto } from '../db/queries'
import { useStore } from '../hooks/useStore'
import Modal from './Modal'
import MonthPicker from './MonthPicker'
import MaterialVariantPicker from './MaterialVariantPicker'
import { parseQuantityInput } from '../utils/quantityInput'
import StorageLocationField from './StorageLocationField'
import { persistStorageLocation } from '../utils/storageLocation'
import { materialNeedsExpiry } from '../utils/materialVariants'

interface EditMaterialModalProps {
  material: MaterialWithLots | null
  onClose: () => void
}

export default function EditMaterialModal({ material, onClose }: EditMaterialModalProps) {
  const refresh = useStore((s) => s.refresh)
  const [name, setName] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!material) return
    setName(material.name)
    setStorageLocation(material.storage_location ?? '')
    setPhotoUrl(null)
    if (material.photo_blob_id) {
      getPhoto(material.photo_blob_id).then((blob) => {
        if (blob) setPhotoUrl(URL.createObjectURL(blob))
      })
    }
  }, [material])

  if (!material) return null

  const needsExpiry = materialNeedsExpiry(material)
  const isVariant = material.mode === 'variant'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const location = await persistStorageLocation(storageLocation)
      await updateMaterial(material!.id!, {
        name: name.trim(),
        storage_location: location,
      })
      await refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  async function handlePhotoUpload(file: File) {
    setPhotoLoading(true)
    try {
      if (material?.photo_blob_id) await deletePhoto(material.photo_blob_id)
      const photoId = await savePhoto(file)
      await updateMaterial(material!.id!, { photo_blob_id: photoId })
      setPhotoUrl(URL.createObjectURL(file))
      await refresh()
    } finally {
      setPhotoLoading(false)
    }
  }

  async function handleDeletePhoto() {
    if (!material?.photo_blob_id) return
    await deletePhoto(material.photo_blob_id)
    await updateMaterial(material.id!, { photo_blob_id: undefined })
    setPhotoUrl(null)
    await refresh()
  }

  async function handleDelete() {
    if (!confirm(`„${material!.name}" wirklich löschen?`)) return
    await deleteMaterial(material!.id!)
    await refresh()
    onClose()
  }

  async function updateLotQty(lotId: number, value: string) {
    const qty = parseQuantityInput(value)
    if (qty == null || qty < 1) return
    await updateMaterialLot(lotId, { quantity: qty })
    await refresh()
  }

  async function updateLotExpiry(lotId: number, expiry: string) {
    await updateMaterialLot(lotId, { expiry_date: expiry })
    await refresh()
  }

  async function updateLotVariant(lotId: number, variantLabel: string) {
    if (!variantLabel) return
    await updateMaterialLot(lotId, { variant_label: variantLabel })
    await refresh()
  }

  async function removeLot(lotId: number) {
    await deleteMaterialLot(lotId)
    await refresh()
  }

  return (
    <Modal open={!!material} onClose={onClose} title="Material bearbeiten">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
            required
          />
        </div>

        <StorageLocationField value={storageLocation} onChange={setStorageLocation} />

        {material.lots.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Bestand</p>
            {material.lots.map((lot) => (
              <div key={lot.id} className="rounded-xl border border-gray-200 p-3 space-y-2">
                {isVariant && material.variant_preset && (
                  <MaterialVariantPicker
                    preset={material.variant_preset}
                    value={lot.variant_label ?? ''}
                    onChange={(v) => updateLotVariant(lot.id!, v)}
                  />
                )}
                {needsExpiry && (
                  <MonthPicker
                    value={lot.expiry_date ?? ''}
                    onChange={(v) => updateLotExpiry(lot.id!, v)}
                    label="Ablaufmonat"
                  />
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Menge</label>
                  <input
                    type="number"
                    min={1}
                    defaultValue={lot.quantity}
                    onBlur={(e) => updateLotQty(lot.id!, e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-navy"
                  />
                </div>
                {material.lots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLot(lot.id!)}
                    className="text-xs text-red-600"
                  >
                    Eintrag entfernen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Material-Foto</p>
          {photoUrl ? (
            <div className="relative w-24 h-24">
              <img src={photoUrl} alt={material.name} className="w-24 h-24 object-cover rounded-xl" />
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
                disabled={photoLoading}
                className="flex-1 flex items-center justify-center gap-2 text-sm text-brand-navy border border-brand-navy/30 rounded-xl px-3 py-2 hover:bg-brand-navy-50"
              >
                {photoLoading ? 'Wird gespeichert…' : 'Foto aufnehmen'}
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={photoLoading}
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
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700">
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex-1 bg-brand-navy hover:bg-brand-navy-dark disabled:bg-gray-200 text-white font-semibold py-3 rounded-xl"
          >
            {loading ? '…' : 'Speichern'}
          </button>
        </div>
        <button type="button" onClick={handleDelete} className="w-full text-red-600 text-sm py-2">
          Material löschen
        </button>
      </form>
    </Modal>
  )
}
