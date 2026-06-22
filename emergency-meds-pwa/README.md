# VialCheck – PWA

Offline-First Progressive Web App (**VialCheck**) zur Verwaltung von Notfallmedikamenten mit Barcode/DataMatrix-Scanner. UI-Sprache: **Deutsch**.

**Stand:** Juni 2026

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| UI | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand (`useStore`) |
| DB | Dexie.js → IndexedDB (`emergency-meds`) |
| Routing | React Router v7 |
| PWA | vite-plugin-pwa (Service Worker, Offline) |
| Scanner | @zxing/browser (Kamera + Test-Modus) |
| OCR | Tesseract.js |
| GS1 | Parser in `src/utils/barcode.ts` (AI 01 GTIN, AI 17 MHD) |

## Projektstruktur

```
src/
├── main.tsx, App.tsx          # Router, Tab-Bar, Monats-Erinnerung
├── db/
│   ├── schema.ts              # Dexie v1→v2 Migration
│   ├── queries.ts             # CRUD, Ablauf-Queries
│   └── backup.ts              # JSON Export/Import
├── hooks/
│   ├── useStore.ts            # Zentraler App-State
│   └── useExpiryReminder.ts   # Monatsende-Modal
├── types/                     # Medication, Batch, Refill, Backup
├── utils/
│   ├── expiry.ts              # MHD-Logik, Farben
│   ├── expiryReminder.ts      # Monatsübersicht + Notifications
│   ├── medicationDisplay.ts   # Handels-/Wirkstoffname, mg/Ampulle
│   ├── quantityInput.ts       # Mengenfeld, Schnellauswahl 1-2-3-5
│   ├── barcode.ts             # GS1-Parser
│   └── ocr.ts
├── pages/
│   ├── InventoryPage.tsx      # Tab Bestand
│   ├── ScannerPage.tsx        # Tab Scanner
│   └── RefillPage.tsx         # Tab Nachfüllen
└── components/
    ├── MedicationCard, AddMedicationSheet, AddBatchSheet
    ├── ConsumeSheet, EditMedicationModal, BackupSheet
    ├── ExpiryReminderModal, MonthPicker, BottomSheet, …
```

## Datenbank (IndexedDB v2)

| Tabelle | Felder (Auszug) |
|---------|-----------------|
| **medications** | id, barcode (unique), handelsname, wirkstoffname, display_name, photo_blob_id, ml_per_ampule, mg_per_ml |
| **medication_batches** | id, medication_id, expiry_date (yyyy-MM), quantity |
| **refill_list** | id, medication_id, amount_needed |
| **photos** | id, blob |

**Migration v1→v2:** Legacy-Feld `name` → `handelsname` / `wirkstoffname` / `display_name`.

## Kernlogik

| Tab | Verhalten |
|-----|-----------|
| **Bestand** | Alphabetische Liste nach Primärname; Chargen pro MHD; Farben: abgelaufen rot, ≤3 Monate gelb, sonst grün; Verbrauch mit Charge-Auswahl; Bearbeiten; Backup Export/Import |
| **Scanner** | Kamera / Galerie / Test-Modus; GS1 + OCR; bekannt → Charge hinzufügen; unbekannt → Neuanlage (Zusammenführung nur bei gleichem Handelsnamen) |
| **Nachfüllen** | Untertab **Verbraucht** (refill_list) und **Ablauf**: zuerst **Abgelaufen**, darunter **Bald ablaufend** (≤3 Monate); jeweils „Ersetzt“-Dialog; Badge zählt beide + Verbraucht |

### MHD & Erinnerungen

- Ablaufmonat als `yyyy-MM` in DB, Anzeige `MM.yyyy`
- **Monatsübersicht:** Am letzten Tag des Monats beim App-Start Modal + optional System-Benachrichtigung (nur wenn App geöffnet wird; kein Hintergrund-Push ohne Server)
- Schnellauswahl Menge beim Hinzufügen: **1 · 2 · 3 · 5**

### Namen & Anzeige

- Handelsname + Wirkstoffname, wählbare Überschrift (`display_name`)
- mg/Ampulle berechnet: `ml_per_ampule × mg_per_ml`

## Entwicklung

```powershell
cd emergency-meds-pwa
.\npm_run.bat run dev      # http://localhost:5173
.\npm_run.bat run build    # dist/
.\npm_run.bat run preview
```

Aus dem Repo-Root:

```powershell
.\serve_pwa.bat           # Build + http-server + Tailscale Serve (nur Dev)
```

## Produktion (Vercel + Domain)

| | |
|---|---|
| **Live-URL** | https://vialcheck.app |
| **Vercel** | Projekt *VialCheck*, Root Directory `emergency-meds-pwa` |
| **GitHub** | https://github.com/PfarrhofIb/VialCheck — Push auf `main` → Auto-Deploy |
| **Domain** | `vialcheck.app` bei uniteddomains |
| **DNS** | A `@` + A `*` → `216.198.79.1` (Vercel) |
| **SPA-Routing** | `vercel.json` im PWA-Ordner |

Redirect: `vialcheck-eta.vercel.app` → `vialcheck.app` (307).

Keine Server-Env-Variablen. Daten bleiben lokal in IndexedDB.

## Testen

| Umgebung | Nutzung |
|----------|---------|
| Chrome (localhost) | Primäre Entwicklung |
| DevTools `Ctrl+Shift+M` | Mobile-Ansicht |
| DevTools → Network → Offline | Offline-Modus |
| Chrome → „App installieren" | PWA-Installation (HTTPS nötig) |
| Scanner am PC | Tab Scanner → „Test-Modus" → Barcode manuell |

## Handy-Zugriff (Produktion)

1. Chrome → https://vialcheck.app
2. Menü → **App installieren**

## Handy-Zugriff via Tailscale Serve (Dev)

Alternative für lokale Entwicklung — feste HTTPS-URL im Tailnet, PC muss laufen.

### Einmalig: Tailscale Serve aktivieren

1. Im Browser öffnen (am PC, eingeloggt bei Tailscale):
   ```
   https://login.tailscale.com/f/serve?node=nLjZMcJeDW11CNTRL
   ```
2. Serve für den Tailnet aktivieren bestätigen.

### Server starten

```powershell
cd C:\Users\afri8\Documents\emergency_meds
.\serve_pwa.bat
```

Oder manuell im PWA-Ordner:

```powershell
.\npm_run.bat run build
npx http-server dist -p 8080 -a 127.0.0.1 -c-1 -P http://127.0.0.1:8080/index.html
tailscale serve --bg --yes http://127.0.0.1:8080
```

### Auf dem Handy

1. **Tailscale-App** installieren und mit demselben Konto anmelden
2. Im Chrome öffnen: `https://laptop-onifsvh7.tailfd525a.ts.net`
3. Menü → **App installieren**

Funktioniert im WLAN und unterwegs (PC muss laufen, Tailscale aktiv).

## Bekannte Hinweise

- Daten liegen lokal in IndexedDB; Backup manuell als JSON (Google Drive etc.)
- Nach Code-Änderungen: neu bauen + App auf dem Handy neu laden
- PWA-Installation: Produktion über **vialcheck.app**; Dev über Tailscale oder localhost
- Monats-Benachrichtigung: kein zuverlässiger Hintergrund-Push ohne Server

## Noch offen / Ideen

- Automatische Hintergrund-Erinnerung (Push-Server oder native App)
- Automatisierte Tests
- Sync zwischen Geräten

## Paralleles Flutter-Projekt

Im übergeordneten Ordner `emergency_meds/` liegt eine ältere **Flutter/Android-App** (sqflite, provider). Aktive Entwicklung erfolgt in dieser **PWA**.
