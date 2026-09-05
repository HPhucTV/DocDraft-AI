import os

start_bat = """@echo off
title DocDraft AI - One-Click Launcher
cd /d "%~dp0"

echo ==============================================================================
echo       DOCDRAFT AI - HE THONG SOAN THAO VAN BAN THONG MINH NGHI DINH 30
echo       Next.js 14 App Router + FastAPI Microservice + DeepSeek / Gemini AI
echo ==============================================================================
echo.

REM 1. KIEM TRA NODE.JS
where node >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Node.js tren may tinh!
    echo Vui long cai dat Node.js phien ban 18+ tu https://nodejs.org
    pause
    exit /b 1
)

REM 2. KIEM TRA PYTHON
where python >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Python tren may tinh!
    echo Vui long cai dat Python 3.10+ tu https://python.org
    pause
    exit /b 1
)

REM 3. KIEM TRA TEP CAU HINH .ENV
if not exist ".env" (
    echo [*] Dang khoi tao tep .env tu .env.example...
    copy ".env.example" ".env" >nul
    echo [OK] Da tao tep .env thanh cong.
)

REM 4. KIEM TRA NODE_MODULES
if not exist "node_modules" (
    echo [*] Dang cai dat thu vien npm...
    call npm install
    if errorlevel 1 (
        echo [LOI] Khong the cai dat thu vien npm!
        pause
        exit /b 1
    )
)

REM 5. KHOI TAO PRISMA CLIENT
echo [1/3] Dang khoi tao Prisma ORM Client...
call npx prisma generate >nul 2>&1

REM 6. GIAI PHONG CONG NEU DANG BI CHIEM DUNG
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM 7. KHOI DONG CAC DICH VU
echo [2/3] Dang khoi dong Document Service (FastAPI Microservice tren cong 8000)...
start "DocDraft Document Service (:8000)" cmd /k "python -m uvicorn app.main:app --app-dir services/document-service --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Dang khoi dong Ung dung Next.js (Web Frontend tren cong 3000)...
start "DocDraft Next.js Web (:3000)" cmd /k "npm run dev"

echo.
echo ==============================================================================
echo       TOAN BO HE THONG DOCDRAFT AI DA KHOI DONG THANH CONG!
echo ==============================================================================
echo.
echo   * Giao dien Web:         http://localhost:3000
echo   * Trinh soan thao A4:    http://localhost:3000/editor
echo   * Quan tri Mau van ban:  http://localhost:3000/admin/templates
echo   * Thong ke Phan tich:    http://localhost:3000/admin/analytics
echo   * Document API Docs:     http://localhost:8000/docs
echo   * Kiem tra suc khoe:     http://localhost:8000/health
echo.
echo   Meo: Ban co the nhap dup chuot vao tep stop.bat de tat toan bo he thong.
echo.
echo Dang tu dong mo trinh duyet sau 4 giay...
ping 127.0.0.1 -n 5 >nul
start http://localhost:3000

echo.
echo ==============================================================================
echo   He thong dang chay on dinh. Ban co the thu nho cua so nay.
echo   - Nhap 'stop' roi an Enter de DUNG toan bo dich vu.
echo   - Hoac chay tep stop.bat bat ky luc nao de tat.
echo ==============================================================================
:WAIT_LOOP
set /p USER_CMD="Nhap 'stop' de tat he thong: "
if /i "%USER_CMD%"=="stop" (
    call "%~dp0stop.bat"
    exit /b 0
)
goto :WAIT_LOOP
"""

stop_bat = """@echo off
title DocDraft AI - Stop All Services
cd /d "%~dp0"

echo ==============================================================================
echo       DANG DUNG TOAN BO DICH VU DOCDRAFT AI...
echo ==============================================================================
echo.

REM 1. DUNG TIEN TRINH TREN CONG 3000 VA 8000
echo [*] Dang giai phong cong 3000 (Next.js) va cong 8000 (FastAPI)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Write-Host '  -> Da dung tien trinh PID:' $_.OwningProcess; Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

REM 2. DUNG DOCKER CONTAINERS NEU DANG CHAY
echo [*] Dang kiem tra va dung Docker containers neu co...
where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose down >nul 2>&1
)

echo.
echo ==============================================================================
echo       DA DUNG TOAN BO HE THONG DOCDRAFT AI THANH CONG!
echo ==============================================================================
echo.
ping 127.0.0.1 -n 3 >nul
"""

start_alias = """@echo off
cd /d "%~dp0"
call "%~dp0start.bat"
"""

start_ps1 = """# ==============================================================================
# DOCDRAFT AI - POWERSHELL ONE-CLICK LAUNCHER
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "DocDraft AI - Hệ thống soạn thảo thông minh NĐ 30"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "      DOCDRAFT AI - HE THONG SOAN THAO VAN BAN THONG MINH NGHI DINH 30" -ForegroundColor White
Write-Host "      Next.js 14 App Router + FastAPI Microservice + DeepSeek / Gemini AI" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[LOI] Khong tim thay Node.js! Vui long cai dat Node.js 18+ tu https://nodejs.org" -ForegroundColor Red
    Read-Host "Nhan Enter de thoat..."
    exit 1
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[LOI] Khong tim thay Python! Vui long cai dat Python 3.10+ tu https://python.org" -ForegroundColor Red
    Read-Host "Nhan Enter de thoat..."
    exit 1
}

if (-not (Test-Path ".env")) {
    Write-Host "[*] Dang khoi tao tep .env tu .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Da tao tep .env thanh cong." -ForegroundColor Green
}

if (-not (Test-Path "node_modules")) {
    Write-Host "[*] Dang cai dat thu vien npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[LOI] Khong the cai dat thu vien npm!" -ForegroundColor Red
        Read-Host "Nhan Enter de thoat..."
        exit 1
    }
}

Write-Host "[1/3] Dang khoi tao Prisma ORM Client..." -ForegroundColor Cyan
npx prisma generate | Out-Null

Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Host "[2/3] Dang khoi dong Document Service (FastAPI Microservice tren cong 8000)..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "python -m uvicorn app.main:app --app-dir services/document-service --host 127.0.0.1 --port 8000 --reload"

Write-Host "[3/3] Dang khoi dong Ung dung Next.js (Web Frontend tren cong 3000)..." -ForegroundColor Cyan
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm run dev"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "      TOAN BO HE THONG DOCDRAFT AI DA KHOI DONG THANH CONG!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   * Giao dien Web:         http://localhost:3000" -ForegroundColor White
Write-Host "   * Trinh soan thao A4:    http://localhost:3000/editor" -ForegroundColor White
Write-Host "   * Quan tri Mau van ban:  http://localhost:3000/admin/templates" -ForegroundColor White
Write-Host "   * Thong ke Phan tich:    http://localhost:3000/admin/analytics" -ForegroundColor White
Write-Host "   * Document API Docs:     http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "   * Kiem tra suc khoe:     http://localhost:8000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dang tu dong mo trinh duyet sau 4 giay..." -ForegroundColor Gray
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Nhap 'stop' roi an Enter de dung toan bo he thong:" -ForegroundColor Cyan
$cmd = Read-Host
if ($cmd -eq "stop") {
    & "cmd.exe" /c stop.bat
}
"""

def write_file(path, content, encoding="ascii"):
    crlf = content.strip().replace("\r\n", "\n").replace("\n", "\r\n")
    with open(path, "wb") as f:
        f.write(crlf.encode(encoding))
    print(f"Written: {path} ({len(crlf)} bytes)")

write_file("start.bat", start_bat, "ascii")
write_file("stop.bat", stop_bat, "ascii")
write_file("start-docdraft.bat", start_alias, "ascii")
write_file("start-docdraft.ps1", start_ps1, "utf-8")
