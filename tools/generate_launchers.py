import os

start_bat_content = """@echo off
chcp 65001 >nul
title DocDraft AI - Trình khởi chạy hệ thống (One-Click Launcher)
cd /d "%~dp0"

echo ==============================================================================
echo       📄 DOCDRAFT AI — HỆ THỐNG SOẠN THẢO VĂN BẢN THÔNG MINH NGHỊ ĐỊNH 30
echo       Next.js 14 App Router + FastAPI Microservice + DeepSeek / Gemini AI
echo ==============================================================================
echo.

REM 1. KIỂM TRA MÔI TRƯỜNG NODE.JS
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LỖI] Chưa tìm thấy Node.js trên máy tính của bạn!
    echo Vui lòng cài đặt Node.js phiên bản 18+ từ https://nodejs.org
    pause
    exit /b 1
)

REM 2. KIỂM TRA MÔI TRƯỜNG PYTHON
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [LỖI] Chưa tìm thấy Python trên máy tính của bạn!
    echo Vui lòng cài đặt Python 3.10+ từ https://python.org (nhớ tích chọn Add Python to PATH)
    pause
    exit /b 1
)

REM 3. KIỂM TRA TỆP CẤU HÌNH .ENV
if not exist ".env" (
    echo [THÔNG BÁO] Chưa có tệp .env, đang tự động khởi tạo từ .env.example...
    copy ".env.example" ".env" >nul
    echo [OK] Đã tạo tệp .env thành công.
)

REM 4. KIỂM TRA THƯ VIỆN NODE.JS (NODE_MODULES)
if not exist "node_modules" (
    echo [THÔNG BÁO] Đang cài đặt thư viện Node.js (npm install)...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [LỖI] Không thể cài đặt dependencies npm!
        pause
        exit /b 1
    )
)

REM 5. ĐỒNG BỘ PRISMA CLIENT
echo [1/3] Đang khởi tạo Prisma ORM Client...
call npx prisma generate >nul 2>&1

REM 6. GIẢI PHÓNG CỔNG NẾU ĐANG BỊ CHIẾM DỤNG
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,8000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

REM 7. KHỞI ĐỘNG CÁC DỊCH VỤ CỤC BỘ
echo.
echo [2/3] Đang khởi động Document Service (FastAPI Microservice trên cổng 8000)...
start "DocDraft AI - Document Service (FastAPI :8000)" cmd /k "title DocDraft Document Service (Port 8000) && cd /d "%~dp0" && python -m uvicorn app.main:app --app-dir services/document-service --host 127.0.0.1 --port 8000 --reload"

echo [3/3] Đang khởi động Ứng dụng Next.js (Web Frontend trên cổng 3000)...
start "DocDraft AI - Next.js Web (:3000)" cmd /k "title DocDraft Next.js Web (Port 3000) && cd /d "%~dp0" && npm run dev"

echo.
echo ==============================================================================
echo       🚀 TOÀN BỘ HỆ THỐNG DOCDRAFT AI ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG!
echo ==============================================================================
echo.
echo   🌐 Giao diện Web chính:           http://localhost:3000
echo   📝 Trình soạn thảo trực quan:      http://localhost:3000/editor
echo   ⚙️ Quản trị Mẫu văn bản:          http://localhost:3000/admin/templates
echo   📊 Thống kê & Phân tích:          http://localhost:3000/admin/analytics
echo   📄 Microservice Document API:     http://localhost:8000/docs
echo   ❤️ Kiểm tra sức khỏe hệ thống:     http://localhost:8000/health
echo.
echo   ℹ️ Mẹo: Để dừng toàn bộ hệ thống, hãy nhấp đúp tệp stop.bat
echo.
echo Đang tự động mở trình duyệt web sau 4 giây...
ping 127.0.0.1 -n 5 >nul
start http://localhost:3000

echo.
echo Hệ thống đang chạy trong nền. Nhấn phím bất kỳ trong cửa sổ này để DỪNG toàn bộ dịch vụ...
pause >nul
call "%~dp0stop.bat"
exit /b 0
"""

stop_bat_content = """@echo off
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
"""

start_alias_content = """@echo off
cd /d "%~dp0"
call "%~dp0start.bat"
"""

def write_crlf(filepath, content):
    crlf_content = content.strip().replace("\r\n", "\n").replace("\n", "\r\n")
    with open(filepath, "wb") as f:
        f.write(crlf_content.encode("utf-8"))
    print(f"Written: {filepath} (size: {len(crlf_content)} bytes)")

if __name__ == "__main__":
    write_crlf("start.bat", start_bat_content)
    write_crlf("stop.bat", stop_bat_content)
    write_crlf("start-docdraft.bat", start_alias_content)
