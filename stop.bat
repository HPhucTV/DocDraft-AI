@echo off
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