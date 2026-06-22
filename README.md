# VialCheck

Notfallmedikamenten-Bestand verwalten — offline-first PWA mit MHD-Überwachung, Nachfüllliste und Datensicherung.

**App-Name:** VialCheck  
**Produktion:** https://vialcheck.app

## Projekte

| Ordner | Beschreibung | Status |
|--------|--------------|--------|
| **`emergency-meds-pwa/`** | React-PWA (IndexedDB, installierbar) | **Aktiv** |
| **Repo-Root** (`lib/`, `android/`) | Flutter-Android-App | Legacy |

Dokumentation: [`emergency-meds-pwa/README.md`](emergency-meds-pwa/README.md)  
Cursor-Regel (vollständiger Kontext): `.cursor/rules/emergency-meds-project.mdc`

## Features (PWA)

- **Bestand** mit Chargen, MHD-Farben (rot/gelb/grün), Verbrauch
- **Nachfüllen:** Verbraucht → Abgelaufen → Bald ablaufend → Bestellt
- **Medikament hinzufügen** mit Autocomplete (25 Notfallmedikamente) und Ampullen-Foto/OCR
- **Backup** als `.vialcheck` (Speichern oder Teilen)
- **Monatsübersicht** am letzten Tag des Monats

## Schnellstart

```powershell
cd emergency-meds-pwa
.\npm_run.bat run dev
```

**Deploy:** Push auf `main` → Vercel baut automatisch für vialcheck.app

**GitHub:** https://github.com/PfarrhofIb/VialCheck

**Handy (Dev, PC muss laufen):**

```powershell
.\serve_pwa.bat
```

## Logo

Master: `Bilder/VialCheck Logo groß.png` → Icons in `emergency-meds-pwa/public/`.  
Details: [`emergency-meds-pwa/README.md`](emergency-meds-pwa/README.md#logo--app-icon)
