# VialCheck – PWA

Offline-First Progressive Web App (**VialCheck**) zur Verwaltung von **Notfallmedikamenten** und **Notfallmaterial**. UI-Sprache: **Deutsch**.

**Stand:** Juni 2026 · **Version:** 0.60 · **Produktion:** https://vialcheck.app

Änderungshistorie: [`CHANGELOG.md`](CHANGELOG.md)

## Tech-Stack

| Bereich | Technologie |
|---------|-------------|
| UI | React 19 + TypeScript + Vite 8 |
| Styling | Tailwind CSS v4, **Clinical Trust** (Navy `#1B3A5C`, Grün `#2ECC71`) |
| State | Zustand (`useStore`) |
| DB | Dexie.js → IndexedDB (`emergency-meds`, **v6**) |
| Routing | React Router v7 |
| PWA | vite-plugin-pwa (Service Worker, Offline) |
| OCR | Tesseract.js (Ampullen-Foto beim Hinzufügen/Bearbeiten) |

## Navigation

| Tab | Route | Inhalt |
|-----|-------|--------|
| **Medikamente** | `/` | Bestand, Chargen, Backup |
| **Material** | `/material` | Materialbestand, Varianten, Backup |
| **Nachfüllen** | `/nachfullen` | Medikamente + Material (Badge) |

Oben rechts: **Impressum** (Logo-Button). `/scanner` leitet auf `/` um.

## Projektstruktur

```
src/
├── main.tsx, App.tsx
├── data/
│   ├── medicationCatalog.ts   # 25 Notfallmedikamente (Vorschläge)
│   └── materialCatalog.ts     # 71 Material-Einträge (Notfallrucksack)
├── db/
│   ├── schema.ts              # Dexie v1→v6
│   ├── queries.ts, materialQueries.ts, storageLocationQueries.ts
│   └── backup.ts              # Export/Import Backup v3
├── hooks/useStore.ts, useExpiryReminder.ts
├── pages/
│   ├── InventoryPage.tsx      # Medikamente
│   ├── MaterialsPage.tsx      # Material
│   └── RefillPage.tsx         # Nachfüllen
├── components/
│   ├── Medikamente: MedicationCard, AddMedicationSheet, …
│   ├── Material: MaterialCard, AddMaterialSheet, MaterialNameField, …
│   └── BackupSheet, AboutModal, MonthPicker, StorageLocationField, …
└── utils/
    ├── medicationSuggestions.ts, materialSuggestions.ts
    ├── materialVariants.ts    # Varianten-Presets & Größenlisten
    └── expiry.ts, backupFile.ts, ocr.ts, …
```

## Datenbank (IndexedDB v6)

| Tabelle | Inhalt |
|---------|--------|
| **medications** | Handels-/Wirkstoffname, Foto, Konzentration, barcode, storage_location |
| **medication_batches** | Chargen mit MHD, Menge |
| **refill_list** | Nachfüllen Medikamente |
| **order_markers** | „Bestellt“-Status (Medikamente) |
| **materials** | name, mode (`simple` \| `variant` \| `no_expiry`), variant_preset, Foto, storage_location |
| **material_lots** | variant_label, expiry_date (optional), quantity |
| **material_refill_list** | Nachfüllen Material |
| **material_order_markers** | „Bestellt“-Status (Material) |
| **storage_locations** | Autocomplete für „Einsortiert in“ |
| **photos** | Bild-Blobs (Med + Material) |

## Kernlogik

### Medikamente

- Chargen pro MHD; Farben rot/gelb/grün; Verbrauch mit Charge
- Autocomplete ab 2 Zeichen (Katalog + lokaler Bestand)
- Ampullen-Foto + OCR; Thumbnail auf Karte
- Feld **„Einsortiert in“** mit Autocomplete

### Material

Drei Modi:

| Modus | Beispiel | MHD |
|-------|----------|-----|
| `simple` | Infusionsbesteck, PEEP-Ventil | Optional |
| `variant` | Venflon, Tubus, Guedel, I-Gel, … | Je nach Preset (Maske ohne Pflicht-MHD) |
| `no_expiry` | Schere, Ambubeutel | Nein |

- Autocomplete aus **Material-Katalog** (71 Einträge) + lokalem Bestand
- 11 **Varianten-Presets** — Details in [`materialCatalog.draft.md`](src/data/materialCatalog.draft.md)
- Foto, Einsortier-Feld, Nachfüllen-Integration wie bei Medikamenten

### Nachfüllen

Eine Liste in Reihenfolge: **Verbraucht** → **Abgelaufen** → **Bald ablaufend** (≤3 Mon.) → **Bestellt** — für Medikamente und Material.

### Backup (v3)

| | |
|---|---|
| **Dateiendung** | `.vialcheck` |
| **Inhalt** | Medikamente, Material, Chargen/Lots, Nachfülllisten, Fotos, Bestellt-Marker, Lagerorte |
| **Import** | `.vialcheck` und ältere `.json` (v1–v2 ohne Material) |
| **Zugriff** | Tab Medikamente oder Material |

## Entwicklung

```powershell
cd emergency-meds-pwa
.\npm_run.bat run dev
.\npm_run.bat run build
```

## Produktion

| | |
|---|---|
| **Live** | https://vialcheck.app |
| **GitHub** | https://github.com/PfarrhofIb/VialCheck |
| **Deploy** | Push auf `main` → Vercel (`emergency-meds-pwa/`) |

## Noch offen

- Medikamenten-Katalog aus Ampullarium (nach Dosierungs-Bereinigung)
- Hintergrund-Push / Geräte-Sync
- Automatisierte Tests

## Paralleles Flutter-Projekt

Ältere **Flutter/Android-App** im Repo-Root (Legacy). Aktive Entwicklung nur in dieser PWA.
