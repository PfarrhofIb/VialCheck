@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo === Emergency Meds PWA - Tailscale Serve ===
echo.

echo [1/3] Build...
call npm run build
if errorlevel 1 (
  echo Build fehlgeschlagen.
  exit /b 1
)

echo.
echo [2/3] Lokaler Server auf Port 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 .*LISTENING"') do (
  echo Port 8080 bereits belegt - ueberspringe Start.
  goto :serve
)
start "Emergency-Meds-HTTP" /MIN cmd /c "npx --yes http-server dist -p 8080 -a 127.0.0.1 -c-1 -P http://127.0.0.1:8080/index.html"
timeout /t 2 /nobreak >nul

:serve
echo.
echo [3/3] Tailscale Serve (HTTPS)...
tailscale serve reset 2>nul
tailscale serve --bg --yes http://127.0.0.1:8080
if errorlevel 1 (
  echo.
  echo FEHLER: Tailscale Serve ist auf deinem Tailnet noch nicht aktiviert.
  echo Einmalig im Browser oeffnen und aktivieren:
  echo   https://login.tailscale.com/admin/acls
  echo   oder den Link aus der Tailscale-Meldung oben.
  echo.
  exit /b 1
)

echo.
tailscale serve status
echo.
echo === Fertig ===
echo Oeffne auf dem Handy (Tailscale muss aktiv sein):
echo   https://laptop-onifsvh7.tailfd525a.ts.net
echo.
echo PWA installieren: Chrome - Menue - App installieren
pause
