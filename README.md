# VialCheck

Notfallmedikamenten- und **Material**-Bestand verwalten — offline-first PWA mit MHD-Überwachung, Nachfüllliste und Datensicherung.

**App-Name:** VialCheck · **Version:** 0.60  
**Produktion:** https://vialcheck.app

## Projekte

| Ordner | Beschreibung | Status |
|--------|--------------|--------|
| **`emergency-meds-pwa/`** | React-PWA (IndexedDB, installierbar) | **Aktiv** |
| **Repo-Root** (`lib/`, `android/`) | Flutter-Android-App | Legacy |

Dokumentation:

- PWA-Details: [`emergency-meds-pwa/README.md`](emergency-meds-pwa/README.md)
- **Changelog (inkl. 17.06.2026):** [`emergency-meds-pwa/CHANGELOG.md`](emergency-meds-pwa/CHANGELOG.md)
- Material-Katalog-Referenz: [`emergency-meds-pwa/src/data/materialCatalog.draft.md`](emergency-meds-pwa/src/data/materialCatalog.draft.md)
- Cursor-Regel: `.cursor/rules/emergency-meds-project.mdc`

## Features (PWA, Stand v0.60)

### Medikamente

- Bestand mit Chargen, MHD-Farben, Verbrauch, Fotos auf Karten
- Autocomplete (25 Notfallmedikamente), Ampullen-OCR
- Feld „Einsortiert in“ mit Autocomplete

### Material (neu ab v0.56)

- Eigener Tab mit 71 Katalog-Einträgen (Notfallrucksack-Inventar)
- Varianten: Venflon, Tubus, Guedel, Magill, AuraGain, I-Gel, Spritzen, Spatel, Masken, Absaugkatheter
- Drei Modi: mit MHD (optional), mit Größe, ohne MHD
- Nachfüllen, Fotos, Einsortier-Feld, Backup

### Gemeinsam

- **Nachfüllen:** Verbraucht → Abgelaufen → Bald ablaufend → Bestellt
- **Backup** `.vialcheck` v3 (Med + Material, Speichern/Teilen)
- **Monatsübersicht** am letzten Tag des Monats

## Schnellstart

```powershell
cd emergency-meds-pwa
.\npm_run.bat run dev
```

**Deploy:** Push auf `main` → Vercel → vialcheck.app

**GitHub:** https://github.com/PfarrhofIb/VialCheck

## Logo

Master: `Bilder/VialCheck Logo groß.png` → Icons in `emergency-meds-pwa/public/`
