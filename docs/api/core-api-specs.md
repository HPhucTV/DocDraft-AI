# ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG CỐT LÕI (CORE REST API SPECIFICATION)

> **Mã tài liệu:** API-001  
> **Phân cấp ưu tiên:** **P0 (Critical — Bắt buộc trước khi code MVP)**  
> **Trạng thái:** Approved  
> **Framework:** Next.js 14+ Route Handlers (App Router)  
> **Base URL:** `/api`  
> **Cập nhật lần cuối:** 2026-09-05  

---

## 1. NGUYÊN TẮC THIẾT KẾ & QUY CHUẨN CHUNG

* **Định dạng dữ liệu:** Mọi dữ liệu trao đổi (Request & Response) đều ở chuẩn `application/json` (UTF-8).
* **Xác thực phiên làm việc:** Sử dụng Session Cookie từ NextAuth.js v5. Nếu không có session hoặc token hết hạn, API trả về `401 Unauthorized`.
* **Cấu trúc phản hồi lỗi thống nhất (Standardized Error Response):**
  ```json
  {
    "error": {
      "code": "VALIDATION_FAILED",
      "message": "Dữ liệu nhập vào không hợp lệ",
      "details": [
        {
          "field": "title",
          "issue": "Tiêu đề văn bản không được để trống"
        }
      ]
    }
  }
  ```

---

## 2. TYPESCRIPT INTERFACES CHUẨN HÓA

```typescript
// Định nghĩa kiểu dữ liệu phản hồi danh sách phân trang
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

// Kiểu dữ liệu Draft cơ bản
export interface DocumentDraftDTO {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  template_id: string | null;
  mode: 'FORM' | 'RAW_POLISH' | 'IMPORT' | 'SCAN_OCR';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'EXPORTED' | 'ARCHIVED';
  language: 'vi' | 'en' | 'vi-en';
  current_version: number;
  word_count: number;
  last_compliance_score: number | null;
  qr_verify_code: string | null;
  created_at: string;
  updated_at: string;
}

// Request Payload tạo mới Draft
export interface CreateDraftRequest {
  title: string;
  template_id?: string;
  folder_id?: string;
  mode?: 'FORM' | 'RAW_POLISH' | 'IMPORT';
  raw_input_data?: Record<string, any>;
  content_json?: Record<string, any>; // Tiptap JSON AST
}

// Request Payload cập nhật Draft
export interface UpdateDraftRequest {
  title?: string;
  folder_id?: string | null;
  content_json?: Record<string, any>;
  edit_source?: 'AI_GENERATE' | 'AI_INLINE_EDIT' | 'AI_CHAT_APPLY' | 'USER_MANUAL';
  change_summary?: string;
}
```

---

## 3. DANH MỤC CÁC ENDPOINT CỐT LÕI (CORE ENDPOINTS)

### 3.1. Quản lý Văn bản nháp (Document Drafts)

#### `GET /api/drafts`
* **Mô tả:** Lấy danh sách văn bản của người dùng hiện tại (hỗ trợ tìm kiếm, lọc, phân trang).
* **Query Parameters:**
  * `page` (number, default: 1)
  * `limit` (number, default: 12)
  * `folder_id` (string, optional): Lọc theo thư mục
  * `status` (string, optional): Lọc theo trạng thái
  * `industry_pack` (string, optional): Lọc theo gói ngành
  * `search` (string, optional): Tìm kiếm toàn văn tiếng Việt
  * `trash` (boolean, optional, default: false): Xem thùng rác
* **Response 200 OK:**
  ```json
  {
    "data": [
      {
        "id": "c7a6e124-7f8d-4e92-bc10-184529f79b32",
        "title": "Tờ trình xin kinh phí hội nghị 2026",
        "template_id": "to-trinh-kinh-phi",
        "folder_id": "f583e201-9231-41fa-8bb3-41589139ab31",
        "status": "DRAFT",
        "current_version": 3,
        "word_count": 480,
        "updated_at": "2026-09-05T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total_items": 1,
      "total_pages": 1
    }
  }
  ```

#### `POST /api/drafts`
* **Mô tả:** Khởi tạo một văn bản nháp mới.
* **Request Body:** `CreateDraftRequest`
* **Response 201 Created:** Trả về đối tượng `DocumentDraftDTO` vừa tạo.

#### `GET /api/drafts/:id`
* **Mô tả:** Lấy chi tiết toàn bộ văn bản (bao gồm cả `content_json` của Tiptap Editor).
* **Response 200 OK:**
  ```json
  {
    "id": "c7a6e124-7f8d-4e92-bc10-184529f79b32",
    "title": "Tờ trình xin kinh phí hội nghị 2026",
    "content_json": {
      "type": "doc",
      "content": [
        {
          "type": "table",
          "content": [...]
        }
      ]
    },
    "current_version": 3,
    "status": "DRAFT"
  }
  ```

#### `PUT /api/drafts/:id`
* **Mô tả:** Tự động lưu (Auto-save) hoặc lưu thủ công nội dung văn bản. Tự động sinh snapshot phiên bản mới trong `draft_versions` nếu có thay đổi nội dung.
* **Request Body:** `UpdateDraftRequest`
* **Response 200 OK:**
  ```json
  {
    "success": true,
    "version": 4,
    "saved_at": "2026-09-05T10:35:12Z"
  }
  ```

#### `DELETE /api/drafts/:id`
* **Mô tả:** Xóa văn bản (Chuyển vào Thùng rác - Soft delete: cập nhật `deleted_at = NOW()`).
* **Response 200 OK:** `{"success": true, "message": "Đã di chuyển vào thùng rác"}`

#### `POST /api/drafts/:id/restore`
* **Mô tả:** Phục hồi văn bản từ thùng rác (`deleted_at = NULL`).
* **Response 200 OK:** `{"success": true, "message": "Phục hồi thành công"}`

---

### 3.2. Quản lý Phiên bản (Version History)

#### `GET /api/drafts/:id/versions`
* **Mô tả:** Lấy danh sách tối đa 50 snapshot lịch sử của văn bản kèm nhãn nguồn gốc `edit_source`.
* **Response 200 OK:**
  ```json
  [
    {
      "version_number": 3,
      "edit_source": "AI_INLINE_EDIT",
      "change_summary": "AI chuẩn hóa phần căn cứ pháp lý",
      "created_at": "2026-09-05T10:30:00Z"
    },
    {
      "version_number": 2,
      "edit_source": "USER_MANUAL",
      "change_summary": "Người dùng sửa số tiền dự toán",
      "created_at": "2026-09-05T10:15:00Z"
    }
  ]
  ```

#### `POST /api/drafts/:id/rollback`
* **Mô tả:** Khôi phục nội dung văn bản về một snapshot phiên bản cụ thể.
* **Request Body:** `{"target_version": 2}`
* **Response 200 OK:** Trả về `content_json` đã rollback và tăng `current_version`.

---

### 3.3. Quản lý Thư mục (Folders)

* `GET /api/folders`: Lấy danh sách cây thư mục của user.
* `POST /api/folders`: Tạo thư mục mới (`name`, `color`, `parent_folder_id`).
* `DELETE /api/folders/:id`: Xóa thư mục (các văn bản bên trong tự động chuyển ra ngoài `folder_id = NULL`).

---

### 3.4. Chia sẻ & Cộng tác (Sharing)

#### `POST /api/drafts/:id/share`
* **Mô tả:** Tạo hoặc cập nhật liên kết chia sẻ văn bản bảo mật.
* **Request Body:**
  ```json
  {
    "permission": "VIEW", // hoặc 'COMMENT', 'EDIT'
    "password": "optional_password",
    "expires_in_days": 7
  }
  ```
* **Response 200 OK:**
  ```json
  {
    "share_url": "https://docdraft.vn/shared/a9f8b2c1d4e3",
    "share_token": "a9f8b2c1d4e3",
    "permission": "VIEW",
    "expires_at": "2026-09-12T10:00:00Z"
  }
  ```
