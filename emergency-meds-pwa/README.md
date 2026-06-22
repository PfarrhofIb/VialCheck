# VialCheck – PWA

Offline-First Progressive Web App (**VialCheck**) zur Verwaltung von Notfallmedikamenten. UI-Sprache: **Deutsch**.

**Stand:** Juni 2026

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| UI | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4, **Clinical Trust** (Navy `#1B3A5C`, Grün `#2ECC71`) |
| State | Zustand (`useStore`) |
| DB | Dexie.js → IndexedDB (`emergency-meds`, **v3**) |
| Routing | React Router v7 |
| PWA | vite-plugin-pwa (Service Worker, Offline) |
| OCR | Tesseract.js (Ampullen-Foto beim Hinzufügen/Bearbeiten) |

## Navigation

| Position | Route | Inhalt |
|----------|-------|--------|
| Links | `/` | **Bestand** |
| Mitte | — | VialCheck-Logo (dekorativ) |
| Rechts | `/nachfullen` | **Nachfüllen** (mit Badge) |

Kein Scanner-Tab. `/scanner` leitet auf `/` um.

## Projektstruktur

```
src/
├── main.tsx, App.tsx          # Router, Tab-Bar, Monats-Erinnerung
├── index.css                  # Brand-Farben (@theme)
├── data/medicationCatalog.ts  # 25 Notfallmedikamente (Vorschlagskatalog)
├── db/
│   ├── schema.ts              # Dexie v1→v2→v3
│   ├── queries.ts             # CRUD, Ablauf, Bestellt-Marker
│   └── backup.ts              # Export/Import inkl. order_markers
├── hooks/
│   ├── useStore.ts
│   └── useExpiryReminder.ts
├── types/
├── utils/
│   ├── expiry.ts, expiryReminder.ts, medicationDisplay.ts
│   ├── medicationSuggestions.ts  # Autocomplete
│   ├── quantityInput.ts, backupFile.ts, ocr.ts
├── pages/
│   ├── InventoryPage.tsx      # Bestand
│   └── RefillPage.tsx         # Nachfüllen
└── components/
    ├── MedicationCard, AddMedicationSheet, AddBatchSheet
    ├── ConsumeSheet, EditMedicationModal, BackupSheet
    ├── MedicationNameFields, ExpiryReminderModal, …
```

## Datenbank (IndexedDB v3)

| Tabelle | Felder (Auszug) |
|---------|-----------------|
| **medications** | id, barcode (unique), handelsname, wirkstoffname, display_name, photo_blob_id, ml_per_ampule, mg_per_ml |
| **medication_batches** | id, medication_id, expiry_date (yyyy-MM), quantity |
| **refill_list** | id, medication_id, amount_needed |
| **photos** | id, blob |
| **order_markers** | target_type (batch/refill), target_id, medication_id, ordered_at |

**Migrationen:** v1→v2 (Legacy `name` → Handels-/Wirkstoffname), v2→v3 (`order_markers` für „Bestellt“).

## Kernlogik

### Bestand

- Alphabetische Liste nach Primärname; Chargen pro MHD
- Farben: abgelaufen rot, ≤3 Monate gelb, sonst grün
- Verbrauch mit Charge-Auswahl; Bearbeiten; Datensicherung

### Medikament hinzufügen / bearbeiten

- Handelsname + Wirkstoffname mit wählbarer Überschrift
- **Autocomplete** ab 2 Zeichen (Katalog + lokaler Bestand) → füllt Namen und Konzentration
- Ampullen-Foto per Kamera/Galerie mit OCR (Tesseract)
- Schnellauswahl Menge: **1 · 2 · 3 · 5**

### Nachfüllen

Eine scrollbare Liste (keine Untertabs), Reihenfolge:

1. **Verbraucht** — aus refill_list
2. **Abgelaufen**
3. **Bald ablaufend** (≤3 Monate)
4. **Bestellt** — alle Typen zusammen, bereit zum Einsortieren

Aktionen pro Eintrag: **Bestellt** → nach Lieferung **Aufgefüllt** / **Ersetzt**.

### MHD & Erinnerungen

- Ablaufmonat `yyyy-MM` in DB, Anzeige `MM.yyyy`
- **Monatsübersicht:** letzter Tag des Monats — Modal + optionale System-Benachrichtigung (nur bei geöffneter App)

### Backup

| | |
|---|---|
| **Dateiendung** | `.vialcheck` (JSON-Inhalt) |
| **Export** | „Auf Gerät speichern“ oder „Teilen…“ |
| **Import** | `.vialcheck` und ältere `.json` |
| **Inhalt** | Medikamente, Chargen, Nachfüllliste, Fotos, Bestellt-Marker |

## Entwicklung

```powershell
cd emergency-meds-pwa
.\npm_run.bat run dev      # http://localhost:5173
.\npm_run.bat run build    # dist/
.\npm_run.bat run preview
```

Aus dem Repo-Root (Dev am Handy via Tailscale):

```powershell
.\serve_pwa.bat
```

## Produktion (Vercel + Domain)

| | |
|---|---|
| **Live-URL** | https://vialcheck.app |
| **Vercel** | Root Directory `emergency-meds-pwa` |
| **GitHub** | https://github.com/PfarrhofIb/VialCheck — Push auf `main` → Auto-Deploy |
| **DNS** | A `@` + A `*` → `216.198.79.1` |
| **SPA-Routing** | `vercel.json` |

Keine Server-Env-Variablen. Daten bleiben lokal in IndexedDB.

## Logo & App-Icon

| Datei | Zweck |
|-------|--------|
| `../Bilder/VialCheck Logo groß.png` | Master (1024×1024) |
| `public/favicon.png` | Browser-Tab |
| `public/icons/icon-192.png` | PWA, Benachrichtigungen |
| `public/icons/icon-512.png` | PWA-Manifest |
| `public/icons/icon-512-maskable.png` | Maskable (Android Install) |
| `public/icons/apple-touch-icon.png` | iOS Homescreen |

`theme-color`: `#1B3A5C`. Nach Icon-Änderung: build, PNGs committen, pushen.

**Prüfen:** https://vialcheck.app/icons/icon-192.png

**PWA auf dem Handy:** Alte App deinstallieren, Speicher löschen, neu installieren.

## Testen

| Umgebung | Nutzung |
|----------|---------|
| Chrome (localhost) | Primäre Entwicklung |
| DevTools `Ctrl+Shift+M` | Mobile-Ansicht |
| DevTools → Offline | Offline-Modus |
| Chrome → „App installieren" | PWA (HTTPS nötig) |
| https://vialcheck.app | Produktion |

## Handy-Zugriff (Produktion)

1. Chrome → https://vialcheck.app
2. Menü → **App installieren**

## Handy-Zugriff via Tailscale Serve (Dev)

```powershell
cd C:\Users\afri8\Documents\emergency_meds
.\serve_pwa.bat
```

1. Tailscale-App auf dem Handy
2. Chrome → `https://laptop-onifsvh7.tailfd525a.ts.net`
3. **App installieren**

## Bekannte Hinweise

- Daten lokal in IndexedDB; Backup manuell als `.vialcheck`
- Monats-Benachrichtigung: kein Hintergrund-Push ohne Server
- Medikamenten-Katalog fest eingebaut (`src/data/medicationCatalog.ts`) — bei Bedarf erweitern und deployen

## Noch offen

- Hintergrund-Push / Sync zwischen Geräten
- Automatisierte Tests

## Paralleles Flutter-Projekt

Im übergeordneten Ordner liegt eine ältere **Flutter/Android-App** (Legacy). Aktive Entwicklung in dieser **PWA**.
