@echo off
title DocDraft AI - Seed Database
cd /d "%~dp0"

echo ==============================================================================
echo       DOCDRAFT AI - NAP DU LIEU MAU VA TAI KHOAN DUNG THU (SEEDING)
echo ==============================================================================
echo.
echo [*] Dang nap 4 tai khoan mau (Admin, Lanh dao, Chuyen vien, Doc gia)...
echo [*] Dang nap 26 bieu mau hanh chinh & doanh nghiep chuan Nghi dinh 30...
echo.

REM Dam bao database container dang bat
docker --version >nul 2>&1
if not errorlevel 1 (
    docker start docdraft-postgres >nul 2>&1
)

call npm run prisma:seed

echo.
echo ==============================================================================
echo [OK] Nap du lieu mau thanh cong!
echo Mat khau mac dinh cho ca 4 tai khoan la: Admin@123456
echo ==============================================================================
echo.
pause
