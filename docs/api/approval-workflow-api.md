# ĐẶC TẢ GIAO DIỆN QUY TRÌNH TRÌNH KÝ & XÁC THỰC MÃ QR (APPROVAL WORKFLOW API)

> **Mã tài liệu:** API-004  
> **Phân cấp ưu tiên:** **P2 (Medium — Mở rộng Phase 3–4)**  
> **Trạng thái:** Approved  
> **Mục tiêu:** Quản lý quy trình xét duyệt nội bộ và phát hành bản gốc có mã QR xác thực  
> **Cập nhật lần cuối:** 2026-09-05  

---

## 1. LƯU ĐỒ NGHIỆP VỤ TRÌNH KÝ & XÁC THỰC (MERMAID FLOWCHART)

```mermaid
flowchart TD
    A[Người soạn bấm 'Trình ký'] --> B[POST /api/approval/submit]
    B --> C[Khởi tạo approval_chains & approval_steps]
    C --> D[Gửi email/thông báo in-app cho Người duyệt bước 1]
    
    D --> E{Người duyệt bước 1 xem xét}
    E -->|Bác bỏ / Yêu cầu sửa| F[POST /api/approval/:id/action -> REJECT]
    F --> G[Trả về trạng thái DRAFT + Mở khóa sửa]
    
    E -->|Chấp thuận| H[POST /api/approval/:id/action -> APPROVE]
    H --> I{Còn bước duyệt tiếp theo?}
    I -->|Còn| J[Chuyển tiếp cho Lãnh đạo cấp cao]
    J --> E
    
    I -->|Hết (Duyệt cuối)| K[Hoàn tất phê duyệt: APPROVED]
    K --> L[Khóa văn bản & Sinh mã QR duy nhất]
    L --> M[Xuất bản PDF có Watermark & QR Code]
    
    N[Người nhận quét mã QR] --> O[GET /api/verify/:qrCode]
    O --> P[Hiển thị trang thông tin xác thực bản gốc]
```

---

## 2. TYPESCRIPT INTERFACES ĐẶC TẢ DỮ LIỆU

```typescript
export interface SubmitApprovalRequest {
  draft_id: string;
  note?: string;
  approvers: Array<{
    step_number: number;
    approver_id: string;
  }>;
}

export interface ApprovalActionRequest {
  action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  comments?: string;
  apply_signature?: boolean; // Tự động chèn ảnh chữ ký của người duyệt vào văn bản
}

export interface DocumentVerificationResponse {
  is_valid: boolean;
  document_title: string;
  document_type: string;
  issuing_organization: string;
  approved_by: string;
  approver_title: string;
  approval_timestamp: string;
  sha256_integrity_hash: string;
  pdf_download_url?: string;
}
```

---

## 3. DANH MỤC CÁC ENDPOINT CHI TIẾT

### 3.1. `POST /api/approval/submit` — Khởi tạo luồng trình ký
* **Mô tả:** Chuyển văn bản từ `DRAFT` sang `PENDING_REVIEW` và thiết lập danh sách người duyệt tuần tự.
* **Request Body:** `SubmitApprovalRequest`
* **Response 201 Created:** Trả về đối tượng `chain_id` và thông báo khởi tạo thành công.

### 3.2. `GET /api/approval/pending` — Danh sách văn bản chờ tôi duyệt
* **Mô tả:** Lấy danh sách các văn bản mà người dùng hiện tại đang là người duyệt ở bước hiện hành.
* **Response 200 OK:**
  ```json
  [
    {
      "chain_id": "8a7b9c1d-2e3f-4a5b-6c7d-8e9f0a1b2c3d",
      "draft_id": "c7a6e124-7f8d-4e92-bc10-184529f79b32",
      "title": "Tờ trình phê duyệt kinh phí mua sắm thiết bị",
      "submitted_by": "Nguyễn Văn A (Chuyên viên)",
      "step_number": 1,
      "submitted_at": "2026-09-05T09:15:00Z"
    }
  ]
  ```

### 3.3. `POST /api/approval/:chainId/action` — Thực hiện hành động phê duyệt
* **Mô tả:** Người duyệt thực hiện Chấp thuận (`APPROVE`), Từ chối (`REJECT`) hoặc Yêu cầu sửa đổi (`REQUEST_CHANGES`).
* **Request Body:** `ApprovalActionRequest`
* **Response 200 OK:** Cập nhật trạng thái bước duyệt và chuyển tiếp bước tiếp theo.

### 3.4. `GET /api/verify/:qrCode` — Trang tra cứu công khai xác thực bản gốc
* **Mô tả:** **Không yêu cầu đăng nhập (Public Endpoint)**. Dành cho đối tác, người nhận văn bản quét mã QR in trên tệp PDF để xác minh tài liệu thật.
* **Response 200 OK:**
  ```json
  {
    "is_valid": true,
    "document_title": "Tờ trình phê duyệt kinh phí năm 2026",
    "document_type": "Tờ trình",
    "issuing_organization": "Công ty Cổ phần Công nghệ Alpha",
    "approved_by": "Trần Văn Bình",
    "approver_title": "Tổng Giám đốc",
    "approval_timestamp": "2026-09-05T14:30:00Z",
    "sha256_integrity_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
  ```
