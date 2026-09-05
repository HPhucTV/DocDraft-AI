@echo off
chcp 65001 >nul
title DocDraft AI - Dừng toàn bộ hệ thống
cd /d "%~dp0"

echo ==============================================================================
echo       🛑 ĐANG DỪNG TOÀN BỘ DỊCH VỤ DOCDRAFT AI...
echo ==============================================================================
echo.

REM 1. DỪNG TIẾN TRÌNH TRÊN CỔNG 3000 VÀ 8000
echo [*] Đang giải phóng cổng 3000 (Next.js) và cổng 8000 (FastAPI)...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Write-Host '  -> Da dung tien trinh PID:' $_.OwningProcess; Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

REM 2. DỪNG DOCKER CONTAINERS NẾU ĐANG CHẠY
echo [*] Đang kiểm tra và dừng Docker containers nếu có...
where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose down >nul 2>&1
)

echo.
echo ==============================================================================
echo       ✅ ĐÃ DỪNG TOÀN BỘ HỆ THỐNG DOCDRAFT AI THÀNH CÔNG!
echo ==============================================================================
echo.
ping 127.0.0.1 -n 3 >nul