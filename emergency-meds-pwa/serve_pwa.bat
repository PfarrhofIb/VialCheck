@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo === VialCheck PWA - Tailscale Serve ===
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
  echo Alten Server beenden (PID %%a)...
  taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul
start "VialCheck-HTTP" /MIN cmd /c "npx --yes http-server dist -p 8080 -a 127.0.0.1 -c-1 -P http://127.0.0.1:8080/index.html"
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Tailscale Serve (HTTPS)...
tailscale serve reset 2>nul
tailscale serve --bg --yes http://127.0.0.1:8080
if errorlevel 1 (
  echo.
  echo FEHLER: Tailscale Serve ist auf deinem Tailnet noch nicht aktiviert.
  echo.
  exit /b 1
)

echo.
tailscale serve status
echo.
echo === Fertig ===
echo Teste das neue Icon im Browser:
echo   https://DEINE-URL/icons/icon-192.png
echo.
echo PWA neu installieren: alte App loeschen, dann Chrome - App installieren
pause
