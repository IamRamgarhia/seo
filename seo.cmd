@echo off
REM SEO Tool launcher. Starts the dev server in a hidden window and opens
REM the browser to localhost:3000 once the port is reachable. Pinned to
REM the Start Menu / Desktop via Settings -> Install as app.

setlocal
cd /d "%~dp0"

REM Find pnpm or npm
where pnpm >nul 2>&1
if %errorlevel%==0 (
  set "PM=pnpm"
) else (
  where npm >nul 2>&1
  if %errorlevel%==0 (
    set "PM=npm"
  ) else (
    echo Node / npm not found. Install Node 20+ from https://nodejs.org
    pause
    exit /b 1
  )
)

REM Already running?
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000 -TimeoutSec 1).StatusCode | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 (
  start "" "http://localhost:3000"
  exit /b 0
)

REM Start the dev server in a new minimized window so the user can close it
REM later if needed. The window title is fixed so we can find/kill it.
start "SEO Tool server" /min cmd /c "%PM% dev"

REM Wait for the server to come up (up to 60s) then open browser
powershell -NoProfile -Command "for ($i=0; $i -lt 60; $i++) { try { (Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000 -TimeoutSec 1).StatusCode | Out-Null; break } catch { Start-Sleep -Seconds 1 } }"
start "" "http://localhost:3000"
endlocal
