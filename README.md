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

Handy über HTTPS:

```powershell
.\serve_pwa.bat
```

Cursor-Regel mit vollständigem Projektkontext: `.cursor/rules/emergency-meds-project.mdc`
