# Changelog – VialCheck PWA

Format: neueste Einträge oben. Version = `APP_VERSION` in `src/constants/appInfo.ts`.

---

## 2026-06-17 — Med-Foto, Barcode-Scanner (v0.62)

- **Ampullen-Foto beim Anlegen:** Foto wird mit OCR erfasst und beim ersten Speichern in IndexedDB abgelegt (wie Material/Bearbeiten).
- **Barcode/DataMatrix-Scanner** auf dem Medikamente-Tab (`@zxing/browser`): GS1-AI 17 (MHD) wird erkannt; bekanntes Medikament → Schnell-Charge (+1/+5/+10/+20), unbekannt → Neuanlage mit Barcode.
- **`materialCatalog.draft.ts` entfernt** — nur noch `materialCatalog.draft.md` als Referenz.

---

## 2026-06-17 — Material, Katalog & UX (v0.56 → v0.60)

### Übersicht

An diesem Tag wurde die **Material-Verwaltung** fertiggestellt, der **Notfallrucksack-Materialkatalog** aus einer Excel-Inventarliste eingepflegt, gegen Herstellerangaben geprüft und korrigiert, sowie mehrere **UX-Verbesserungen** für Medikamente und Material umgesetzt. Alle Änderungen sind auf `main` gepusht und werden über Vercel auf https://vialcheck.app ausgeliefert.

### Commits (Auszug)

| Commit | Version | Kurzbeschreibung |
|--------|---------|------------------|
| `5493163` | 0.56 | Material-Feature: Varianten, Nachfüllen, Backup v2 |
| `bdd0fe5` | — | Tab „Medikamente“, 3-Spalten-Nav, Impressum oben rechts |
| `81d7f02` | — | Fotos für Material (Kamera/Galerie) |
| `d78d743` | 0.57 | Fotos auf Med-Karten, „Einsortiert in“, Backup v3 |
| `e6935e7` | 0.58 | Material-Katalog (71 Einträge), Autocomplete, Varianten-Presets |
| `f628a23` | 0.59 | Optionales MHD bei Material, Backup-Button Material-Tab |
| `b0adb7f` | 0.60 | Katalog-Größen korrigiert, I-Gel, Absaugkatheter |

---

### 1. Material-Verwaltung (Feature, ab v0.56)

Neuer Tab **Material** (`/material`) neben Medikamente und Nachfüllen.

**Drei Material-Modi:**

| Modus | Bedeutung | MHD |
|-------|-----------|-----|
| `simple` | Einfaches Verbrauchsmaterial | Optional (seit v0.59) |
| `variant` | Größe/Variante per Dropdown | Je nach Preset (Maske ohne Pflicht-MHD) |
| `no_expiry` | Wiederverwendbares Gerät/Werkzeug | Nein |

**Funktionen:**

- Liste mit Suche, MHD-Warnfarben, Low-Stock-Hinweis
- Hinzufügen, Bestand erhöhen, Verbrauchen, Bearbeiten, Löschen
- Foto pro Material (Kamera/Galerie)
- Feld **„Einsortiert in“** mit Autocomplete aus bisherigen Einträgen
- Integration in **Nachfüllen** (Verbraucht / Abgelaufen / Bald ablaufend / Bestellt)
- **Backup** auch vom Material-Tab erreichbar (ab v0.59)

**Neue DB-Tabellen (IndexedDB v4–v6):**

- `materials`, `material_lots`, `material_refill_list`, `material_order_markers`
- `storage_locations` (v6, gemeinsam mit Medikamenten)

**Backup-Format v3** (`BACKUP_VERSION = 3`): enthält zusätzlich Material, Material-Lots, Material-Nachfüllliste, Material-Bestellt-Marker und Lagerorte.

---

### 2. Navigation & UI

- Tab **„Bestand“** → **„Medikamente“**
- Bottom-Navigation: **Medikamente | Material | Nachfüllen** (3 gleich breite Tabs)
- **Impressum** per Logo-Button oben rechts (`AboutModal`)
- **Fotos auf Medikamenten-Karten** (Thumbnail, bisher nur im Bearbeiten-Dialog)
- Fotos werden beim Löschen von Medikament/Material aus `photos` entfernt

---

### 3. Material-Katalog (ab v0.58)

**Quelle:** Excel `Notfallrucksack Inventar Haltbarkeit.xlsx` (Tabelle1, ~130 Zeilen) — nur Material, **kein Ampullarium**.

**Implementierung:**

- Produktion: `src/data/materialCatalog.ts` (71 Einträge)
- Review-Entwurf: `src/data/materialCatalog.draft.md`
- Generator (optional): `scripts/build-material-catalog-draft.mjs`
- Autocomplete: `MaterialNameField` + `materialSuggestions.ts` (Katalog + lokaler Bestand)

**Varianten-Einträge (11):**

| Name | Preset-ID | Dropdown (Stand v0.60) |
|------|-----------|-------------------------|
| Venflon | `venflon` | Orange 14G … Violett 26G |
| ET-Tubus | `tubus_mm` | 1,0 – 10,0 mm (0,5-Schritte) |
| Guedel | `guedel_groesse` | 000, 00, 0 – 5 |
| Magill | `magill_cm` | 15 cm, 20 cm, 25 cm |
| Larynxmaske AuraGain | `larynxmaske_auragain` | 1 – 6 (inkl. 1,5 …) |
| I-Gel | `igel_groesse` | 1 – 5 (inkl. 1,5 …) |
| Spritze | `spritze_ml` | 1, 2, 5, 10, 20, 50 ml |
| Spatel Macintosh | `spatel_macintosh` | 0 – 4 |
| Spatel Miller | `spatel_miller` | 00 – 4 |
| Maske | `maske_groesse` | 0 – 5 (BVM-Nummerierung) |
| Absaugkatheter | `absaugkatheter_ch` | 6–16 CH mit Farbe |

**Mit MHD (23):** Infusion, Venenzugang, Verbände, CO₂-Detektor, PEEP-Ventil, Stepty, …

**Ohne MHD (37):** Ambubeutel, Intubationszubehör, Diagnostik, Trauma, Werkzeug, …

**Bewusst nicht im Katalog:** Beatmungsfilter (am BVM), Cuffdruckmesser.

---

### 4. Katalog-Review & Korrekturen (v0.60)

Nach Abgleich mit Herstellerdaten (Ambu AuraGain, i-gel/Intersurgical, ISO Venflon-Farben, Guedel ISO-Größen, Wikipedia Absaugkatheter-Farbcode, …):

| Änderung | Grund |
|----------|-------|
| Guedel: eigenes Preset statt Tubus-mm | Guedel nutzt Nummerngrößen, nicht Innendurchmesser |
| Magill: cm-Längen statt mm | Zangenlänge, kein Tubus |
| Schleimabsauger → **Absaugkatheter** mit CH/Farbe | Katheterbestand, nicht Pumpe |
| **I-Gel** ergänzt | Geplante künftige Bestückung |
| AuraGain Gr. **6**, Spritze **50 ml** | Hersteller-/ISO-Größen |
| Macintosh **0+1**, Miller **00–4** | Vollständige Spatel-Skalen |
| Maske **0–5** statt groß/klein/mittel | Industriestandard BVM |
| `Elomel` → **Elo-Mel** | Schreibweise |
| `Isareli-Bandage` → **Israeli-Druckverband** | Korrekter Name |
| ET-Tubus 1–10 mm | Unverändert (bewusst breit) |

---

### 5. Optionales MHD bei Material (v0.59)

- Material mit MHD-Feld kann **ohne Ablaufmonat** gespeichert werden
- `MonthPicker`: bei optionalen Feldern **`--`** unten in Monat/Jahr
- Beim **Ersetzen abgelaufenen Materials** bleibt MHD Pflicht

---

### 6. Offen / später

| Thema | Status |
|-------|--------|
| Medikamenten-Katalog aus Ampullarium | Zurückgestellt (Dosierungen zuerst bereinigen) |
| Bestehende DB-Einträge mit alten Katalognamen | Keine Auto-Migration — manuell anpassen |
| `materialCatalog.draft.md` | Review-Referenz (kein `.ts`-Entwurf mehr) |

---

## Ältere Versionen (Kurz)

| Version | Highlights |
|---------|------------|
| ≤0.55 | Medikamenten-Autocomplete, Impressum, Clinical Trust Theme |
| ≤0.54 | Backup `.vialcheck`, Nachfüllen vereinheitlicht, Scanner entfernt |
| Initial | PWA mit Medikamenten, Chargen, Nachfüllliste |
