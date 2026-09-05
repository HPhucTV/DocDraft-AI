# 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY DỰ ÁN DOCDRAFT AI
> **Dành cho người không chuyên (Non-Tech) hoặc người mới bắt đầu**  
> *Bạn không cần biết lập trình vẫn có thể tự khởi động và trải nghiệm đầy đủ hệ thống chỉ với 3 bước đơn giản.*

---

## 📋 MỤC LỤC NHANH
1. [Chuẩn bị 2 phần mềm nền tảng (Cài 1 lần duy nhất)](#1-chuẩn-bị-2-phần-mềm-nền-tảng-cài-1-lần-duy-nhất)
2. [Khởi động dự án chỉ với 1 cú nhấp chuột (Khuyên dùng)](#2-khởi-động-dự-án-chỉ-với-1-cú-nhấp-chuột-khuyên-dùng)
3. [Nạp dữ liệu mẫu & tài khoản dùng thử (Chạy Seed Database)](#3-nạp-dữ-liệu-mẫu--tài-khoản-dùng-thử-chạy-seed-database)
4. [Cách sử dụng và cấu hình AI để soạn thảo văn bản](#4-cách-sử-dụng-và-cấu-hình-ai-để-soạn-thảo-văn-bản)
5. [Cách tắt hệ thống khi dùng xong](#5-cách-tắt-hệ-thống-khi-dùng-xong)
6. [Khắc phục các lỗi thường gặp (FAQ)](#6-khắc-phục-các-lỗi-thường-gặp-faq)

---

## 1. Chuẩn bị 2 phần mềm nền tảng (Cài 1 lần duy nhất)

Trước khi chạy dự án, máy tính Windows của bạn cần có 2 công cụ miễn phí sau:

### 🟢 Phần mềm 1: Node.js (Bộ máy chạy giao diện Web)
1. Truy cập trang chủ chính thức: **[https://nodejs.org](https://nodejs.org)**
2. Bấm vào nút tải bản **LTS (Khuyên dùng cho hầu hết người dùng)** có biểu tượng màu xanh lá.
3. Mở file vừa tải về, bấm **Next $\rightarrow$ Next $\rightarrow$ Install** liên tục theo mặc định đến khi hoàn tất.

### 🟡 Phần mềm 2: Python (Bộ máy xử lý file Word & PDF)
1. Truy cập trang chủ chính thức: **[https://www.python.org/downloads/](https://www.python.org/downloads/)**
2. Bấm nút vàng **Download Python (phiên bản 3.10 trở lên)**.
3. Mở file cài đặt vừa tải về.
4. ⚠️ **BƯỚC QUAN TRỌNG NHẤT:** Ở màn hình cài đặt đầu tiên, hãy **TÍCH CHỌN vào ô vuông nhỏ ở góc dưới cùng**:
   > `☑ Add python.exe to PATH` *(hoặc `Add Python to environment variables`)*
5. Sau khi tích chọn, bấm nút **Install Now** ở phía trên và đợi 1 phút đến khi xong.

---

## 2. Khởi động dự án chỉ với 1 cú nhấp chuột (Khuyên dùng)

Hệ thống đã được lập trình sẵn kịch bản tự động hóa toàn bộ, bạn **không cần gõ bất kỳ dòng lệnh nào**.

### Các bước thực hiện:
1. Mở thư mục dự án **`DOCDRAFT AI`** trên máy tính của bạn.
2. Tìm tệp tin có tên **`start.bat`** (hoặc **`start-docdraft.bat`**).
3. **Nhấp đúp chuột (Double-click)** vào tệp **`start.bat`**.
4. Cửa sổ màu đen sẽ xuất hiện và **tự động thực hiện 100% các công việc**:
   - Tự động tạo tệp cấu hình `.env` nếu bạn chưa có.
   - Tự động tải và cài đặt các thư viện cần thiết.
   - Tự động khởi chạy Document Service (xử lý Word/PDF) tại cổng `8000`.
   - Tự động khởi chạy Ứng dụng Web tại cổng `3000`.
   - **Tự động mở trình duyệt web** đưa bạn thẳng vào trang chủ hệ thống!

---

### 🌐 Các địa chỉ truy cập quan trọng:
Sau khi khởi động thành công, bạn có thể truy cập các đường link sau trên trình duyệt:
* **Trang chủ hệ thống:** [http://localhost:3000](http://localhost:3000)
* **Trang Đăng nhập:** [http://localhost:3000/login](http://localhost:3000/login)
* **Trình soạn thảo văn bản A4 chuẩn NĐ 30:** [http://localhost:3000/editor](http://localhost:3000/editor)
* **Kho 26 Biểu mẫu Hành chính & Doanh nghiệp:** [http://localhost:3000/admin/templates](http://localhost:3000/admin/templates)
* **Trang Cấu hình Khóa AI (BYOK):** [http://localhost:3000/settings](http://localhost:3000/settings)
* **Tài liệu API Xử lý Văn bản:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 3. Nạp dữ liệu mẫu & tài khoản dùng thử (Chạy Seed Database)

> 💡 **Tại sao cần bước này?**  
> Khi bạn vừa tải dự án về hoặc kết nối với cơ sở dữ liệu mới, database ban đầu sẽ hoàn toàn trống.  
> Chạy lệnh **Seed** sẽ tự động nạp sẵn vào hệ thống:
> - **4 tài khoản mẫu** cho 4 vai trò *(Admin, Lãnh đạo duyệt, Chuyên viên soạn, Độc giả xem)*.
> - **26 mẫu biểu văn bản chuẩn Nghị định 30/2020/NĐ-CP** thuộc 9 ngành nghề.
> - **9 danh mục biểu mẫu** chuyên nghiệp.

### Cách 1: Chạy bằng 1 cú nhấp chuột (Khuyên dùng - Không cần gõ lệnh)
1. Mở thư mục dự án **`DOCDRAFT AI`**.
2. Tìm tệp tin có tên **`seed.bat`**.
3. **Nhấp đúp chuột (Double-click)** vào tệp **`seed.bat`**.
4. Cửa sổ màu đen sẽ chạy trong khoảng 3 đến 5 giây và hiện thông báo:  
   `[OK] Nap du lieu mau thanh cong!`
5. Giờ bạn có thể vào trang đăng nhập và sử dụng ngay các tài khoản mẫu!

### Cách 2: Chạy bằng dòng lệnh (Terminal / Command Prompt)
Mở cửa sổ dòng lệnh tại thư mục dự án và chạy:
```bash
npm run prisma:seed
```

---

### 👥 Danh sách Tài khoản Mẫu theo từng Vai trò (Roles)
Sau khi chạy seed, bạn có thể đăng nhập bằng các tài khoản sau (hoặc bấm vào 4 nút gợi ý nhanh trên trang [Đăng nhập](http://localhost:3000/login) để tự động điền):

| Vai trò (Role) | Email đăng nhập | Mật khẩu mặc định | Thẩm quyền & Chức năng chính |
|---|---|---|---|
| 🛡️ **Quản trị viên (ADMIN)** | `admin@docdraft.vn` | `Admin@123456` | Quản trị hệ thống, Quản lý kho mẫu biểu (`/admin/templates`), Xem Dashboard thống kê (`/admin/analytics`). |
| ✍️ **Lãnh đạo Phê duyệt (APPROVER)** | `lanhdao@docdraft.vn` | `Admin@123456` | Thẩm quyền phê duyệt tờ trình/công văn, ký số điện tử, ký nháy, trả lời góp ý văn bản. |
| 📝 **Chuyên viên Soạn thảo (USER)** | `chuyenvien@docdraft.vn` | `Admin@123456` | Soạn thảo A4 với AI Copilot, nạp mẫu biểu, gửi văn bản lên luồng trình ký, xuất file Word. |
| 👁️ **Độc giả Chỉ xem (VIEWER)** | `khach@docdraft.vn` | `Admin@123456` | Chỉ xem văn bản được chia sẻ, tra cứu biểu mẫu dùng chung (quyền Read-only). |

---

## 4. Cách sử dụng và cấu hình AI để soạn thảo văn bản

Để Trợ lý AI có thể tự động viết tờ trình, công văn, quyết định thay bạn, bạn chỉ cần nạp khóa API cá nhân (hoàn toàn miễn phí):

### Cách nhập Khóa AI trực tiếp trên giao diện (Không cần sửa file code):
1. Truy cập vào trang [http://localhost:3000/settings](http://localhost:3000/settings) (Mục **"Bảo mật BYOK"** trên thanh menu).
2. Tại đây, bạn sẽ thấy ô nhập **API Key**:
   * **Google Gemini API Key (Miễn phí & Rất nhanh):** 
     * Vào trang [Google AI Studio](https://aistudio.google.com/app/apikey) $\rightarrow$ Đăng nhập tài khoản Google $\rightarrow$ Bấm nút **"Create API key"** $\rightarrow$ Sao chép (Copy) đoạn mã khóa.
   * **DeepSeek API Key:** Lấy từ trang chủ [DeepSeek Platform](https://platform.deepseek.com/).
3. Dán đoạn mã khóa vào ô tương ứng trên trang Cài đặt và bấm **"Lưu khóa an toàn"**.
4. **Xong!** Giờ bạn có thể vào [http://localhost:3000/editor](http://localhost:3000/editor), gõ yêu cầu văn bản vào ô AI Copilot và bấm Enter để AI tạo dự thảo tự động trong 3 giây.

*(Lưu ý: Khóa của bạn được mã hóa AES-256 lưu trực tiếp trong trình duyệt máy tính của bạn, không bao giờ bị lộ ra bên ngoài).*

---

## 5. Cách tắt hệ thống khi dùng xong

Khi làm việc xong và muốn tắt chương trình để giải phóng bộ nhớ máy tính:
* **Cách 1 (Nhanh nhất):** Tìm tệp tin **`stop.bat`** trong thư mục dự án và **nhấp đúp chuột** vào đó. Hệ thống sẽ tự động đóng toàn bộ các tiến trình đang chạy ngầm một cách an toàn.
* **Cách 2:** Tại cửa sổ lệnh `start.bat` đang mở, bạn chỉ cần gõ chữ `stop` rồi ấn phím **Enter**.

---

## 6. Khắc phục các lỗi thường gặp (FAQ)

### ❓ Lỗi 1: Mở `start.bat` báo lỗi "Khong tim thay Node.js" hoặc "Khong tim thay Python"
* **Nguyên nhân:** Bạn chưa cài đặt hoặc khi cài đặt Python quên chưa tích chọn ô *"Add Python to PATH"*.
* **Cách sửa:** Cài lại Python theo [Bước 1](#1-chuẩn-bị-2-phần-mềm-nền-tảng-cài-1-lần-duy-nhất), nhớ tích chọn ô `Add python.exe to PATH`. Sau đó tắt cửa sổ và mở lại `start.bat`.

### ❓ Lỗi 2: Báo lỗi "Port 3000 / 8000 already in use" (Cổng bị chiếm dụng)
* **Nguyên nhân:** Có một lần chạy trước đó chưa được tắt hoàn toàn.
* **Cách sửa:** Nhấp đúp chuột vào tệp **`stop.bat`** để dọn dẹp cổng mạng, sau đó nhấp đúp lại vào **`start.bat`**.

### ❓ Lỗi 3: AI không phản hồi hoặc báo lỗi khi bấm Soạn thảo
* **Nguyên nhân:** Bạn chưa nhập API Key hoặc API Key đã hết hạn ngạch.
* **Cách sửa:** Vào trang [http://localhost:3000/settings](http://localhost:3000/settings) kiểm tra lại xem đã dán đúng mã API Key và bấm Lưu chưa.

---

## 💡 Dành cho Lập trình viên (Advanced / CLI)

Nếu bạn là lập trình viên muốn chạy từng dịch vụ riêng biệt bằng dòng lệnh:

```bash
# 1. Cài đặt thư viện Frontend
npm install

# 2. Khởi tạo Prisma Client
npx prisma generate

# 3. Chạy máy chủ Web Next.js (Port 3000)
npm run dev

# 4. Chạy Document Service Python (Port 8000) ở một terminal khác
pip install -r services/document-service/requirements.txt
python -m uvicorn app.main:app --app-dir services/document-service --host 127.0.0.1 --port 8000 --reload
```

---
*DocDraft AI — Hệ thống soạn thảo văn bản hành chính thông minh chuẩn Nghị định 30/2020/NĐ-CP.*
