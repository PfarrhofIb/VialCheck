# VialCheck

Notfallmedikamenten-Bestand verwalten — offline-first, mit Scanner.

**App-Name:** VialCheck (Display-Name)  
**Interne Projekte:** `emergency-meds-pwa/` (PWA, aktiv), Flutter-App im Repo-Root (Legacy)

## Projekte

| Ordner | Beschreibung | Status |
|--------|--------------|--------|
| **`emergency-meds-pwa/`** | React-PWA (IndexedDB, PWA installierbar) | **Aktiv** |
| **Repo-Root** (`lib/`, `android/`) | Flutter-Android-App | Legacy / parallel |

Dokumentation: [`emergency-meds-pwa/README.md`](emergency-meds-pwa/README.md)

## Schnellstart (PWA)

```powershell
cd emergency-meds-pwa
.\npm_run.bat run dev
```

**Produktion:** https://vialcheck.app (Vercel, Auto-Deploy bei Push auf `main`)

**GitHub:** https://github.com/PfarrhofIb/VialCheck

Handy lokal testen (Dev, PC muss laufen):

```powershell
.\serve_pwa.bat
```

Cursor-Regel mit vollständigem Projektkontext (inkl. Hosting/DNS): `.cursor/rules/emergency-meds-project.mdc`

## Logo & App-Icon

| | |
|---|---|
| **Master-Datei** | `Bilder/VialCheck Logo groß.png` (1024×1024, Ampulle mit Häkchen) |
| **PWA-Icons** | `emergency-meds-pwa/public/favicon.png`, `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` |
| **Konfiguration** | `vite.config.ts` (PWA-Manifest), `index.html` (Favicon, Apple-Touch-Icon) |

**Logo auf vialcheck.app aktualisieren:** Icons müssen im Git-Repo liegen und nach `main` gepusht werden (Vercel baut aus GitHub). Danach auf dem Handy: alte PWA deinstallieren, Website-Speicher löschen, neu installieren. Prüfen: https://vialcheck.app/icons/icon-192.png (Ampulle, kein rotes Kreuz).

Details zum Generieren und Cache-Verhalten: siehe Cursor-Regel und [`emergency-meds-pwa/README.md`](emergency-meds-pwa/README.md).
