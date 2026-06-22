# Projekt: Emergency Meds – PWA (React + Vite)

> **Verwendung:** Diesen gesamten Inhalt in eine **neue Cursor-Instanz** kopieren (neuer/leerer Projektordner) und mit folgendem Satz starten:
>
> *„Setze das Projekt Schritt für Schritt um. Beginne mit Grundgerüst, Tab-Navigation, Dexie-Schema und der Bestand-Seite.“*

---

## Ziel

Baue eine **offline-first Progressive Web App (PWA)** zur Verwaltung des **Notfallmedikamenten-Bestands** (Rettungsdienst / Erste Hilfe). Die App soll **im Browser** laufen, als PWA installierbar sein und **ohne Internet** funktionieren.

**Sprache der UI:** durchgehend **Deutsch**.

**Wichtig:** Dies ist ein **Neustart** – kein Flutter, kein bestehendes Repo übernehmen. Stack: **React 18+, TypeScript, Vite, PWA**. Kein Backend, keine Cloud-Pflicht.

---

## Test-Umgebung

| Umgebung | Nutzung |
|----------|---------|
| **PC – Chrome** (localhost) | **Primäre** Entwicklung und Tests |
| Chrome DevTools `Ctrl+Shift+M` | Mobile-Ansicht, Gerät „Pixel 8 Pro“ |
| **Pixel 8 Pro – Chrome** | Gelegentlich: Kamera, Touch, PWA-Installation |
| DevTools → Network → Offline | Offline-Modus testen |
| Chrome → „App installieren“ | PWA-Installation am PC testen |

**Am PC eingeschränkt / Workarounds:**
- **Barcode-Scan:** Webcam oder **Test-Modus** (Barcode manuell eingeben) für Entwicklung
- **Ampullen-Foto:** Datei-Upload + optional Webcam; OCR trotzdem implementieren

**Priorität:** Mobil-first Layout, aber **am PC im Browser voll testbar**.

---

## Tech-Stack (verbindlich)

- **React + Vite + TypeScript**
- **PWA:** `vite-plugin-pwa` (Service Worker, Web App Manifest, Offline-Caching)
- **Lokale Datenbank:** IndexedDB via **Dexie.js**
- **Routing:** React Router (3 Haupt-Tabs)
- **State:** React Context oder Zustand (leichtgewichtig)
- **Styling:** Tailwind CSS oder CSS Modules – klar, mobil-first, große Touch-Targets
- **Barcode/DataMatrix:** `@zxing/browser` oder `html5-qrcode`
- **OCR (offline):** Tesseract.js (`tesseract.js`)
- **Datum:** Nur **Monat/Jahr** – Anzeige `MM.yyyy`, Speicherung `yyyy-MM`, gültig bis **Monatsende**

---

## App-Struktur: 3 Tabs

### Tab 1 – Bestand

Liste aller Medikamente mit:

- Name, **Gesamtbestand** (Summe aller Chargen)
- **Chargen pro Ablaufmonat**, z. B.:
  ```
  5× 06.2026
  3× 12.2026
  2× 03.2027
  ```
- MHD-Warnungen: **abgelaufen** / **läuft bald ab** (bis Monatsende gültig)
- Optional: Konzentration (`ml pro Ampulle`, `mg pro ml`)
- Optional: Ampullen-Foto (Thumbnail)

**Aktionen:**
- **„1 Verbraucht“** → Dialog **„Welche Charge wurde verbraucht?“** (Nutzer wählt Ablaufmonat; **kein** automatisches FEFO)
- **Bearbeiten:** Name, Konzentration; Foto **löschen** / **neues Foto**; Chargen nur anzeigen
- **„Charge hinzufügen“** (Anzahl + Ablaufmonat)
- **FAB „Hinzufügen“:**
  1. **Manuell eingeben** (ohne Barcode → `manual_<uuid>`)
  2. **Ampulle fotografieren / Bild hochladen** (OCR: Name, MHD, ggf. mg/ml und ml)

**Leerer Zustand** mit Hilfetext auf Deutsch.

---

### Tab 2 – Scanner

- **Barcode/DataMatrix** per Kamera (am PC: Webcam oder Test-Eingabe)
- **Kamera-Icon:** Ampullen-Foto / Upload + OCR (gleicher Flow wie Bestand)
- Taschenlampe-Toggle falls möglich

**Bekannter Barcode** → Bottom Sheet:
- Medikament gefunden, Chargen anzeigen
- **Charge hinzufügen:** Menge (+1 / +5 / +10 / +20 oder frei) + **Ablaufmonat Pflicht**
- Button „Charge mit Ablaufmonat…“

**Unbekannter Barcode** → Neues-Medikament-Formular (mit Barcode vorausgefüllt)

---

### Tab 3 – Nachfüllen (erweitert)

**Übersicht für alles, was ersetzt oder aufgefüllt werden muss.**

Zwei Bereiche (Abschnitte oder Unter-Tabs):

#### Bereich A: Verbraucht
- Einträge aus **„1 Verbraucht“** (Nachfüllliste)
- Anzeige: Name, benötigte Menge
- **„Aufgefüllt“** → Dialog:
  - „Wurde aufgefüllt?“
  - Toggle: **Bestand im Inventar erhöhen**
  - Wenn ja: Menge (+/−) + **Ablaufmonat der neuen Charge** (Pflichtfeld)
  - Wenn nein: nur aus Liste entfernen

#### Bereich B: Abgelaufen
- Alle Medikamente mit **abgelaufenem MHD** (mindestens eine Charge mit `expiry_date` vor dem aktuellen Monat und Bestand > 0; optional auch leere abgelaufene Chargen ausblenden)
- Anzeige: Name, abgelaufene Charge(n) z. B. `2× 03.2025`, Gesamtbestand
- **„Ersetzt“** → gleicher Dialog wie Aufgefüllt: neue Charge mit **neuem Ablaufmonat** + Menge
- Visuell deutlich als abgelaufen markieren (rot)

**UI:**
- Zwei Abschnitte: **„Verbraucht“** | **„Abgelaufen“**
- **Badge/Counter** am Tab „Nachfüllen“ wenn Einträge in einem der Bereiche vorhanden
- Leerer Zustand pro Bereich mit deutschem Hilfetext

---

## Datenmodell (IndexedDB / Dexie)

### Tabelle `medications`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| id | number (auto) | PK |
| barcode | string, unique | GS1 oder `manual_<uuid>` |
| name | string | |
| expiry_date | string | Zusammenfassung: frühester relevanter MHD (`yyyy-MM`) |
| quantity | number | Summe aller Chargen (denormalisiert) |
| photo_blob_id | string? | Referenz auf Foto in IndexedDB / Blob-Store |
| ml_per_ampule | number? | |
| mg_per_ml | number? | |

### Tabelle `medication_batches`

| Feld | Typ |
|------|-----|
| id | number (auto) |
| medication_id | number (FK) |
| expiry_date | string (`yyyy-MM`) |
| quantity | number |

**Constraint:** `UNIQUE(medication_id, expiry_date)`

### Tabelle `refill_list` (Verbraucht)

| Feld | Typ |
|------|-----|
| id | number (auto) |
| medication_id | number (FK) |
| amount_needed | number |

### Fotos

- Ampullen-Fotos als **Blob in IndexedDB** (oder separate Dexie-Tabelle `photos`)
- Buttons: **„Neues Foto“** / **„Bild löschen“** (mit Bestätigungsdialog)

---

## Geschäftslogik

1. **Mehrere Chargen** pro Medikament (gleiches Medikament, verschiedene MHDs)
2. **Neue Eingabe mit gleichem Namen** (manuell/Foto) → **keine neue Karte**, sondern **neue Charge** zum bestehenden Medikament (auch bei `manual_<uuid>` per Namensabgleich)
3. **Verbrauch:** Nutzer wählt Charge → Menge −1 → `refill_list.amount_needed` +1 (oder neuer Eintrag)
4. **Nachfüllen / Ersetzt:** Neue Charge mit **gewähltem Ablaufmonat**; Eintrag aus jeweiliger Liste entfernen
5. **Abgelaufen:** Automatisch in Tab 3 Bereich B listen (live berechnet aus Chargen, keine separate Tabelle nötig)
6. **MHD:** Nur Monat/Jahr; Warnung wenn bald ablaufend (z. B. innerhalb 3 Monaten – konfigurierbar)
7. **Konzentration:** Optional; Parser für `mg/ml`, `ml`, Verhältnisse wie `1:1000`
8. **Bottom Sheets / Modals:** `safe-area-inset-bottom` / ausreichend Padding – Buttons **nicht** von Android-Navigationsleiste verdeckt

---

## OCR / Parser (Ampullen-Etikett)

Aus erkanntem Text (Tesseract.js, best effort):

- Medikamentenname
- Ablaufmonat (`MM.yyyy`, `MM/YY`, „Verwendbar bis“, etc.)
- `mg/ml`, ml pro Ampulle
- Bei GS1-Barcode: AI `01` (GTIN/PZN), AI `17` (MHD) parsen

**Wenn OCR fehlschlägt:** Formular mit manueller Eingabe, Snackbar: *„Kein Text erkannt. Bitte Daten manuell eingeben.“*

---

## UI/UX

- Mobil-first, große Touch-Targets
- Farben: **Rot** = abgelaufen/kritisch, **Gelb** = läuft ab, **Grün** = OK
- Pull-to-refresh oder Refresh-Button pro Tab
- PWA: installierbar, `manifest.json`, Icons, `theme-color`
- Alle Labels, Buttons, Fehlermeldungen auf **Deutsch**

---

## Bewusst NICHT im MVP

- Online-Medikamentendatenbank (keine kostenlose DE-API; später optional lizenzierte PZN-API + lokaler Cache)
- Benutzer-Accounts / Cloud-Sync
- Desktop-optimiertes Layout (nur responsive, Fokus Mobile)

---

## Projekt-Setup (erste Schritte)

```bash
npm create vite@latest emergency-meds -- --template react-ts
cd emergency-meds
npm install dexie react-router-dom zustand
npm install -D vite-plugin-pwa tailwindcss @tailwindcss/vite
# Barcode + OCR:
npm install @zxing/browser tesseract.js
```

### Ordnerstruktur

```
src/
├── components/       # UI-Bausteine, Sheets, Dialoge
├── pages/            # Bestand, Scanner, Nachfüllen
├── db/               # Dexie-Schema, Migrationen, Queries
├── hooks/
├── utils/            # expiry, ocr, barcode, concentration, sheet-padding
├── types/
├── App.tsx
└── main.tsx
```

### README (Deutsch)

- `npm run dev` – Entwicklung am PC (http://localhost:5173)
- PWA installieren (Chrome)
- Mobile-Test: DevTools Geräte-Modus
- Optional: Build `npm run build` + `npm run preview`

---

## Implementierungs-Reihenfolge (empfohlen)

1. Vite + React + TS + Tailwind + PWA-Grundgerüst
2. Dexie-Schema + Types
3. Tab-Navigation (3 Tabs) + leere Seiten
4. **Tab 1 Bestand:** Liste, Chargen-Anzeige, MHD-Farben
5. Formulare: Manuell hinzufügen, Charge hinzufügen, Verbrauch mit Charge-Auswahl
6. **Tab 3 Nachfüllen:** Verbraucht + Abgelaufen
7. **Tab 2 Scanner:** Barcode + Foto/OCR
8. Fotos (Blob), Löschen/Ersetzen
9. PWA-Offline feintunen, Badge am Nachfüllen-Tab

---

## Qualität

- TypeScript strikt
- Keine unnötige Abstraktion – fokussierte, lesbare Diffs
- Bestehende Konventionen im Projekt einhalten
- Nur sinnvolle Tests, keine Trivial-Tests

---

## Kurz-Checkliste Akzeptanz

- [ ] App läuft offline nach erstem Laden
- [ ] Mehrere Chargen pro Medikament sichtbar (`5× 06.2026`)
- [ ] Verbrauch fragt Charge (MHD) ab
- [ ] Nachfüllen: Verbraucht + Abgelaufen getrennt
- [ ] Nachfüllen/Ersetzt fragt Ablaufmonat ab
- [ ] Scanner + Foto/OCR am PC (Upload) und Handy (Kamera)
- [ ] Foto löschen / neues Foto
- [ ] Bottom-Sheet-Buttons nicht von Nav-Leiste verdeckt
- [ ] Alles UI auf Deutsch
