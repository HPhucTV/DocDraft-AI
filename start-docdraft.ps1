# ==============================================================================
# DOCDRAFT AI — TRÌNH KHỞI CHẠY HỆ THỐNG (POWERSHELL ONE-CLICK LAUNCHER)
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "DocDraft AI - Hệ thống soạn thảo thông minh NĐ 30"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "      📄 DOCDRAFT AI — HỆ THỐNG SOẠN THẢO VĂN BẢN THÔNG MINH NGHỊ ĐỊNH 30" -ForegroundColor White
Write-Host "      Next.js 14 App Router + FastAPI Microservice + DeepSeek / Gemini AI" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiểm tra Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[LỖI] Chưa tìm thấy Node.js trên máy tính! Vui lòng cài đặt từ https://nodejs.org" -ForegroundColor Red
    Read-Host "Nhấn Enter để thoát..."
    exit 1
}

# 2. Kiểm tra Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[LỖI] Chưa tìm thấy Python trên máy tính! Vui lòng cài đặt từ https://python.org" -ForegroundColor Red
    Read-Host "Nhấn Enter để thoát..."
    exit 1
}

# 3. Kiểm tra .env
if (-not (Test-Path ".env")) {
    Write-Host "[THÔNG BÁO] Chưa có tệp .env, đang sao chép từ .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[OK] Đã tạo tệp .env thành công!" -ForegroundColor Green
}

# 4. Kiểm tra node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "[THÔNG BÁO] Đang cài đặt thư viện Node.js (npm install)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[LỖI] Quá trình npm install thất bại!" -ForegroundColor Red
        Read-Host "Nhấn Enter để thoát..."
        exit 1
    }
}

# 5. Khởi tạo Prisma Client
Write-Host "[1/3] Đang khởi tạo Prisma ORM Client..." -ForegroundColor Cyan
npx prisma generate | Out-Null

# 6. Khởi động Document Service FastAPI (:8000)
Write-Host "[2/3] Đang khởi động Document Service (FastAPI Microservice trên cổng 8000)..." -ForegroundColor Cyan
$docServiceProc = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir'; `$Host.UI.RawUI.WindowTitle = 'DocDraft - FastAPI Document Service (:8000)'; python -m uvicorn app.main:app --app-dir services/document-service --host 127.0.0.1 --port 8000 --reload" -PassThru

# 7. Khởi động Next.js (:3000)
Write-Host "[3/3] Đang khởi động Ứng dụng Next.js (Web Frontend trên cổng 3000)..." -ForegroundColor Cyan
$webProc = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir'; `$Host.UI.RawUI.WindowTitle = 'DocDraft - Next.js Web (:3000)'; npm run dev" -PassThru

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "      🚀 TOÀN BỘ HỆ THỐNG DOCDRAFT AI ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   🌐 Giao diện Web chính:           http://localhost:3000" -ForegroundColor White
Write-Host "   📝 Trình soạn thảo trực quan:      http://localhost:3000/editor" -ForegroundColor White
Write-Host "   ⚙️ Quản trị Mẫu văn bản:          http://localhost:3000/admin/templates" -ForegroundColor White
Write-Host "   📊 Thống kê & Phân tích:          http://localhost:3000/admin/analytics" -ForegroundColor White
Write-Host "   📄 Microservice Document API:     http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "   ❤️ Kiểm tra sức khỏe hệ thống:     http://localhost:8000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Đang tự động mở trình duyệt web sau 4 giây..." -ForegroundColor Gray
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Nhấn 'q' rồi nhấn Enter (hoặc chạy .\stop.bat) để tắt toàn bộ dịch vụ..." -ForegroundColor Cyan
$inputKey = Read-Host
if ($inputKey -eq "q" -or $inputKey -eq "Q") {
    & ".\stop.bat"
}
