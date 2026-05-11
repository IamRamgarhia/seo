# One-line installer for Windows. Run via:
#   iwr -useb https://raw.githubusercontent.com/IamRamgarhia/seo/main/install.ps1 | iex
#
# What it does:
#   1. Clones (or pulls) the repo into $HOME\seo
#   2. Auto-detects a free local port (default 3000, falls through to alternatives)
#   3. If Docker Desktop is running -> uses Docker
#   4. Otherwise -> falls back to native Node install via scripts/setup.ps1
#   5. Waits for /api/v1/health to confirm the app is actually up
#   6. Opens the browser to http://localhost:<PORT>
#   7. Drops SEO-Tool-Welcome.txt on the user's Desktop
#
# Idempotent. Safe to re-run for upgrades.

$ErrorActionPreference = "Stop"
$repo = if ($env:SEO_REPO) { $env:SEO_REPO } else { "https://github.com/IamRamgarhia/seo.git" }
$dir = if ($env:SEO_INSTALL_DIR) { $env:SEO_INSTALL_DIR } else { Join-Path $HOME "seo" }
$defaultPort = if ($env:SEO_PORT) { [int]$env:SEO_PORT } else { 3000 }
$desktop = Join-Path $HOME "Desktop"

function Say($m)  { Write-Host "-> $m" -ForegroundColor Green }
function Info($m) { Write-Host "i  $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "!  $m" -ForegroundColor Yellow }
function Die($m)  { Write-Host "X  $m" -ForegroundColor Red; exit 1 }

Say "SEO Tool installer"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Die "git not found. Install git from https://git-scm.com/downloads"
}

# ---- clone or pull -----------------------------------------------------------
if (Test-Path (Join-Path $dir ".git")) {
    Say "Existing install at $dir - pulling latest"
    Push-Location $dir
    try { git pull --ff-only 2>$null | Out-Null } catch { Warn "git pull failed; continuing" }
    Pop-Location
}
else {
    Say "Cloning into $dir"
    git clone --depth 1 $repo $dir 2>$null | Out-Null
}
Set-Location $dir

# ---- find free port ---------------------------------------------------------
function Test-PortInUse($p) {
    try {
        $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction Stop
        return ($conn -ne $null)
    } catch { return $false }
}

$port = $defaultPort
if (Test-PortInUse $port) {
    Warn "Port $port is occupied - finding a free one"
    foreach ($try in @(3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 8080, 8081, 4000, 5000)) {
        if (-not (Test-PortInUse $try)) {
            $port = $try
            break
        }
    }
}
Say "Using port $port"

# ---- Docker or native? -----------------------------------------------------
$hasDocker = $false
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        docker info | Out-Null
        if ($LASTEXITCODE -eq 0) { $hasDocker = $true }
    } catch { $hasDocker = $false }
}

$up = $false

if ($hasDocker) {
    Say "Docker detected - using Docker install"
    try {
        docker compose version | Out-Null
        if ($LASTEXITCODE -ne 0) { Die "Docker is installed but 'docker compose' v2 is missing. Update Docker Desktop." }
    } catch { Die "Docker compose v2 not found." }

    $env:SEO_HOST_PORT = "$port"
    Say "Building image (first run takes 3-5 minutes; later runs are seconds)"
    docker compose up -d --build

    Say "Waiting for the app to come up..."
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:$port/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $up = $true; break }
        } catch {}
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
    }
    Write-Host ""

    if (-not $up) {
        Warn "App didn't respond after 2 minutes."
        Warn "Check logs: cd $dir; docker compose logs -f"
        Warn "Then open http://localhost:$port manually."
    } else {
        Say "App is up at http://localhost:$port"
    }
}
else {
    Warn "Docker not detected - falling back to native install"
    Info "Tip: Docker Desktop makes this much easier: https://www.docker.com/products/docker-desktop/"
    Write-Host ""
    & (Join-Path $dir "scripts/setup.ps1")

    Say "Starting dev server on port $port in background"
    $pm = if (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm" } else { "npm" }
    $logFile = Join-Path $dir "dev-server.log"
    $env:PORT = "$port"
    $proc = Start-Process -FilePath $pm `
        -ArgumentList @("run", "dev") `
        -WorkingDirectory $dir `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError (Join-Path $dir "dev-server.err.log") `
        -PassThru -WindowStyle Hidden
    $proc.Id | Out-File -FilePath (Join-Path $dir ".dev-server.pid") -Encoding ascii

    Say "Waiting for the app to come up... (first build takes 30-60s)"
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:$port/api/v1/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $up = $true; break }
        } catch {}
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    if (-not $up) {
        Warn "App didn't respond yet. Check $logFile for details."
    } else {
        Say "App is up at http://localhost:$port"
    }
}

# ---- write desktop welcome file --------------------------------------------
$welcome = Join-Path $desktop "SEO-Tool-Welcome.txt"
if (Test-Path $desktop) {
    $controls = if ($hasDocker) {
@"
Stop:    cd $dir; docker compose down
Start:   cd $dir; `$env:SEO_HOST_PORT='$port'; docker compose up -d
Logs:    cd $dir; docker compose logs -f
Update:  cd $dir; git pull; `$env:SEO_HOST_PORT='$port'; docker compose up -d --build
"@
    } else {
@"
Stop:    Get-Process -Id (Get-Content $dir\.dev-server.pid) | Stop-Process
Start:   cd $dir; `$env:PORT='$port'; pnpm dev
Logs:    Get-Content $dir\dev-server.log -Wait -Tail 100
Update:  cd $dir; git pull; pnpm install
"@
    }

    $content = @"
======================================================
   SEO TOOL - INSTALLED
======================================================

Open the app:        http://localhost:$port
Install location:    $dir

----------------------- FIRST 5 MIN ------------------
1. Open http://localhost:$port
2. Add a client at /clients/new (paste any domain)
3. Pick an AI provider at /settings:
     - Local Ollama (free, private)  OR
     - Anthropic / OpenAI / Groq / Gemini (paste API key)
4. Run your first audit
5. Tomorrow: the daily agent kicks in automatically

----------------------- CONTROLS ---------------------
$controls

----------------------- TROUBLESHOOT -----------------
Blank page?       Server still building - wait 30-60s and refresh.
Want a password?  Set APP_PASSWORD=yourpassword in $dir\.env.local
                  then restart.
Port conflict?    `$env:SEO_PORT='4000' (or any free port) before
                  re-running the installer.

----------------------- DOCS -------------------------
Repo:     https://github.com/IamRamgarhia/seo
Hosting:  $dir\docs\HOSTING.md
README:   $dir\README.md

======================================================
"@
    $content | Out-File -FilePath $welcome -Encoding utf8
    Say "Created $welcome"
}

# ---- auto-open browser ------------------------------------------------------
$url = "http://localhost:$port"
if ($up) {
    Start-Process $url
}

Write-Host ""
Write-Host "SEO Tool ready." -ForegroundColor Green
Write-Host ""
Write-Host "Open:    $url"
if (Test-Path $welcome) { Write-Host "Guide:   $welcome" }
Write-Host ""
