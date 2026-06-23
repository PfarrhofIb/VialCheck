import Modal from './Modal'
import { APP_NAME, APP_VERSION, CONTACT_EMAIL } from '../constants/appInfo'

interface AboutModalProps {
  open: boolean
  onClose: () => void
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Impressum">
      <div className="space-y-4 text-sm text-gray-700">
        <div className="flex flex-col items-center text-center pb-2">
          <img
            src="/icons/icon-192.png"
            alt=""
            className="w-16 h-16 rounded-2xl shadow-sm mb-3"
          />
          <p className="text-lg font-semibold text-gray-900">{APP_NAME}</p>
          <p className="text-gray-500">Version {APP_VERSION}</p>
        </div>

        <p className="text-gray-600 leading-relaxed">
          Offline-App zur Verwaltung von Notfallmedikamenten und Material — Bestand, MHD und Nachfüllliste.
        </p>

        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Kontakt</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-brand-navy font-medium hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-brand-navy hover:bg-brand-navy-dark text-white font-semibold rounded-xl transition-colors"
        >
          Schließen
        </button>
      </div>
    </Modal>
  )
}
