@echo off
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

REM 5b. KHOI DONG POSTGRES CONTAINER NEU CHAY QUA DOCKER
docker --version >nul 2>&1
if not errorlevel 1 (
    docker start docdraft-postgres >nul 2>&1
)

REM 6. GIAI PHONG CONG NEU DANG BI CHIEM DUNG
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM 7. KHOI DONG CAC DICH VU
echo [2/3] Dang khoi dong Document Service (FastAPI Microservice tren cong 8000)...
start "DocDraft Document Service (:8000)" cmd /k "python -m uvicorn app.main:app --app-dir services/document-service --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Dang khoi dong Ung dung Next.js (Web Frontend tren cong 3000)...
start "DocDraft Next.js Web (:3000)" cmd /k "npm run dev"

REM 7b. KHOI DONG HTTPS PROXY CHO MICROSOFT WORD ADD-IN (:3443)
start "DocDraft Word Add-in HTTPS (:3443)" /min cmd /c "node scripts/word-addin-proxy.js"

echo.
echo ==============================================================================
echo       TOAN BO HE THONG DOCDRAFT AI DA KHOI DONG THANH CONG!
echo ==============================================================================
echo.
echo   * Giao dien Web:         http://localhost:3000
echo   * Trinh soan thao A4:    http://localhost:3000/editor
echo   * Word Add-in (HTTPS):   https://localhost:3443/word-addin
echo   * Quan tri Mau van ban:  http://localhost:3000/admin/templates
echo   * Thong ke Phan tich:    http://localhost:3000/admin/analytics
echo   * Document API Docs:     http://localhost:8000/docs
echo   * Kiem tra suc khoe:     http://localhost:8000/health
echo   Meo: Ban co the nhap dup chuot vao tep seed.bat de nap 4 tai khoan mau va 26 mau bieu.
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