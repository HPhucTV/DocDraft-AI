# ==============================================================================
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