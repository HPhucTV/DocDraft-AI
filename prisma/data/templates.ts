import { FormSchema } from "../../src/types/form-schema";

export interface TemplateSeedData {
  id: string;
  categoryId: string;
  industryPack: string;
  title: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  fewShotExamples: Array<{
    description: string;
    input: Record<string, unknown>;
    output_html: string;
  }>;
  formSchema: FormSchema;
  exportConfig: {
    margins: { top: number; bottom: number; left: number; right: number };
    defaultFont: string;
    fontSize: number;
  };
  isBuiltin: boolean;
  isPublished: boolean;
  avgRating: number;
}

const NGHIDINH30_BASE_SYSTEM_PROMPT = `BẠN LÀ CHUYÊN GIA PHÁP CHẾ VÀ TRƯỞNG PHÒNG HÀNH CHÍNH CÓ 15 NĂM KINH NGHIỆM TẠI VIỆT NAM.
Nhiệm vụ: Tiếp nhận dữ liệu biến số (JSON) hoặc bản nháp thô từ người dùng, tạo ra văn bản hoàn chỉnh chuẩn 100% theo Nghị định số 30/2020/NĐ-CP của Chính phủ về công tác văn thư.

QUY TẮC BỐ CỤC BẮT BUỘC:
1. TIÊU NGỮ & QUỐC HIỆU (Bắt buộc dùng layout table 2 cột, border:none):
   - Cột 1 (rộng 40%, căn giữa):
     * Dòng 1: TÊN CƠ QUAN CHỦ QUẢN (in hoa, đứng, 12pt).
     * Dòng 2: TÊN ĐƠN VỊ SOẠN THẢO (in hoa, đậm, 12-13pt).
     * Dòng 3: Đường kẻ ngang nét liền dưới tên đơn vị.
     * Dòng 4: Số và ký hiệu văn bản (Vd: "Số: [SỐ KÝ HIỆU]/TTr-HCNS").
   - Cột 2 (rộng 60%, căn giữa):
     * Dòng 1: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" (in hoa, đậm, 12-13pt).
     * Dòng 2: "Độc lập - Tự do - Hạnh phúc" (in thường, chữ cái đầu in hoa, đậm, 13-14pt).
     * Dòng 3: Đường gạch ngang nét liền dài bằng dòng chữ tiêu ngữ.
     * Dòng 4: Địa danh, ngày... tháng... năm... (in nghiêng).
2. TÊN LOẠI VĂN BẢN VÀ TRÍCH YẾU: In hoa, căn giữa, in đậm. Trích yếu in thường hoặc in nghiêng bên dưới.
3. KÍNH GỬI / NƠI NHẬN ĐẦU VĂN BẢN: Căn lề trái hoặc thụt đầu dòng rõ ràng.
4. CĂN CỨ PHÁP LÝ: Mỗi căn cứ viết một dòng riêng, mở đầu "Căn cứ...", kết thúc chấm phẩy (;), dòng cuối kết thúc bằng phẩy (,).
5. KẾT THÚC & CHỮ KÝ (Layout table 2 cột, border:none, margin-top:30px):
   - Cột 1 (rộng 50%, căn trái): "Nơi nhận:" (in nghiêng, đậm, gạch chân), các đầu dòng, kết thúc là "- Lưu: VT, [ĐƠN VỊ].".
   - Cột 2 (rộng 50%, căn giữa): CHỨC DANH NGƯỜI KÝ (in hoa, đậm), khoảng trống ký tên, Họ và tên (in đậm).

QUY TẮC CHỐNG ẢO GIÁC (ANTI-HALLUCINATION GUARDRAILS):
- Tuyệt đối KHÔNG tự ý bịa đặt số tiền, ngày tháng, tên người, mã số quyết định khi chưa có trong input.
- Mọi thông tin còn thiếu BẮT BUỘC phải đặt trong dấu ngoặc vuông viết hoa: [TÊN NGƯỜI NHẬN], [SỐ TIỀN CỤ THỂ], [NGÀY BẮT ĐẦU], [CĂN CỨ PHÁP LÝ LIÊN QUAN].

OUTPUT ENFORCEMENT:
- Chỉ trả về chuỗi HTML ngữ nghĩa (table, tr, td, h2, p, strong, em, u).
- Không thêm markdown code block, không thêm lời chào, không giải thích.`;

export const SEED_TEMPLATES: TemplateSeedData[] = [
  // 1. TỜ TRÌNH KINH PHÍ
  {
    id: "to-trinh-kinh-phi",
    categoryId: "administrative",
    industryPack: "ADMINISTRATIVE",
    title: "Tờ trình xin phê duyệt dự toán kinh phí",
    description:
      "Mẫu Tờ trình chuẩn thể thức Nghị định 30/2020/NĐ-CP trình cấp có thẩm quyền xem xét, phê duyệt kế hoạch và dự toán kinh phí thực hiện nhiệm vụ.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Tờ trình xin phê duyệt dự toán kinh phí với thông tin sau:
- Cơ quan cấp trên: {{co_quan_cap_tren}}
- Đơn vị soạn thảo: {{don_vi_soan}}
- Trích yếu nội dung: {{trich_yeu}}
- Mục đích & sự cần thiết: {{muc_dich}}
- Dự toán kinh phí: {{kinh_phi_du_toan}}
- Nguồn kinh phí: {{nguon_kinh_phi}}
- Thời gian thực hiện: {{thoi_gian_thuc_hien}}
- Chức danh người ký: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "co_quan_cap_tren",
          label: "Cơ quan cấp trên / Chủ quản",
          type: "text",
          required: true,
          placeholder: "Vd: ỦY BAN NHÂN DÂN THÀNH PHỐ HÀ NỘI",
          validation: { min_length: 3, max_length: 200 },
        },
        {
          name: "don_vi_soan",
          label: "Đơn vị lập tờ trình",
          type: "text",
          required: true,
          placeholder: "Vd: SỞ THÔNG TIN VÀ TRUYỀN THÔNG",
          validation: { min_length: 3, max_length: 150 },
        },
        {
          name: "trich_yeu",
          label: "Trích yếu nội dung tờ trình",
          type: "text",
          required: true,
          placeholder: "Vd: V/v xin phê duyệt kinh phí triển khai hệ thống chuyển đổi số năm 2026",
          validation: { min_length: 10, max_length: 300 },
        },
        {
          name: "muc_dich",
          label: "Mục đích & Sự cần thiết",
          type: "textarea",
          required: true,
          placeholder: "Nêu rõ căn cứ thực tiễn, tính cấp bách và mục tiêu đạt được...",
          validation: { min_length: 20, max_length: 2000 },
        },
        {
          name: "kinh_phi_du_toan",
          label: "Dự toán kinh phí đề xuất (VNĐ)",
          type: "currency",
          required: true,
          placeholder: "Vd: 250.000.000 VNĐ",
          validation: { min: 1000 },
        },
        {
          name: "nguon_kinh_phi",
          label: "Nguồn kinh phí chi trả",
          type: "select",
          required: true,
          options: [
            { value: "ngan_sach_nha_nuoc", label: "Ngân sách Nhà nước cấp" },
            { value: "ngan_sach_don_vi", label: "Kinh phí thường xuyên của đơn vị" },
            { value: "quy_su_nghiep", label: "Quỹ phát triển hoạt động sự nghiệp" },
            { value: "xa_hoi_hoa", label: "Nguồn tài trợ / Xã hội hóa" },
          ],
        },
        {
          name: "thoi_gian_thuc_hien",
          label: "Thời gian thực hiện dự kiến",
          type: "date",
          required: true,
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người ký",
          type: "text",
          required: true,
          defaultValue: "GIÁM ĐỐC",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người ký",
          type: "text",
          required: true,
          placeholder: "Vd: Nguyễn Văn A",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ mẫu Tờ trình kinh phí phê duyệt chuyển đổi số",
        input: {
          co_quan_cap_tren: "ỦY BAN NHÂN DÂN THÀNH PHỐ HÀ NỘI",
          don_vi_soan: "SỞ THÔNG TIN VÀ TRUYỀN THÔNG",
          trich_yeu: "V/v xin phê duyệt kinh phí triển khai thử nghiệm Trợ lý ảo văn bản năm 2026",
          muc_dich: "Nhằm tối ưu hóa công tác xử lý hồ sơ hành chính, rút ngắn thời gian soạn thảo công văn tờ trình và nâng cao chỉ số cải cách hành chính số của thành phố.",
          kinh_phi_du_toan: 350000000,
          nguon_kinh_phi: "ngan_sach_nha_nuoc",
          thoi_gian_thuc_hien: "2026-06-01",
          chuc_danh_nguoi_ky: "GIÁM ĐỐC",
          ho_ten_nguoi_ky: "Nguyễn Văn Hùng",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>ỦY BAN NHÂN DÂN THÀNH PHỐ HÀ NỘI</strong><br/>
      <strong>SỞ THÔNG TIN VÀ TRUYỀN THÔNG</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/TTr-STTTT
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Hà Nội, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">TỜ TRÌNH</h2>
<p style="text-align:center; font-style:italic;">V/v xin phê duyệt kinh phí triển khai thử nghiệm Trợ lý ảo văn bản năm 2026</p>

<p><strong>Kính gửi:</strong> Ủy ban nhân dân thành phố Hà Nội</p>

<p>Căn cứ Luật Ngân sách nhà nước số 83/2015/QH13;</p>
<p>Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;</p>
<p>Căn cứ Kế hoạch Chuyển đổi số thành phố Hà Nội giai đoạn 2026 - 2030;</p>
<p>Xét tình hình thực tế và sự cần thiết nâng cao hiệu suất xử lý hồ sơ hành chính số,</p>

<p>Sở Thông tin và Truyền thông kính trình Ủy ban nhân dân thành phố Hà Nội xem xét, phê duyệt chủ trương và dự toán kinh phí triển khai thử nghiệm Trợ lý ảo văn bản năm 2026 với các nội dung trọng tâm như sau:</p>

<p><strong>1. Sự cần thiết và Mục đích:</strong><br/>
Nhằm tối ưu hóa công tác xử lý hồ sơ hành chính, rút ngắn thời gian soạn thảo công văn tờ trình và nâng cao chỉ số cải cách hành chính số của thành phố.</p>

<p><strong>2. Thời gian thực hiện dự kiến:</strong> Từ tháng 06/2026 đến hết tháng 12/2026.</p>

<p><strong>3. Dự toán kinh phí và Nguồn vốn:</strong><br/>
- Tổng kinh phí đề xuất: <strong>350.000.000 VNĐ</strong> (Bằng chữ: Ba trăm năm mươi triệu đồng chẵn).<br/>
- Nguồn kinh phí: Ngân sách Nhà nước cấp chi thường xuyên năm 2026.<br/>
- Chi tiết các hạng mục dự toán gồm: Phí bản quyền công nghệ, đào tạo chuyển giao, máy chủ bảo mật được đính kèm theo phụ lục Tờ trình này.</p>

<p>Sở Thông tin và Truyền thông kính trình Ủy ban nhân dân thành phố xem xét, quyết định./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; vertical-align:top; border:none;">
      <strong><em><u>Nơi nhận:</u></em></strong><br/>
      - Như kính gửi;<br/>
      - Sở Tài chính (để phối hợp);<br/>
      - Văn phòng UBND thành phố;<br/>
      - Lưu: VT, CNTT.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>GIÁM ĐỐC</strong><br/><br/><br/><br/>
      <strong>Nguyễn Văn Hùng</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 5.0,
  },

  // 2. CÔNG VĂN THÔNG BÁO / HƯỚNG DẪN HÀNH CHÍNH
  {
    id: "cong-van-thong-bao",
    categoryId: "administrative",
    industryPack: "ADMINISTRATIVE",
    title: "Công văn hành chính hướng dẫn / thông báo",
    description:
      "Mẫu Công văn hành chính chuẩn Nghị định 30/2020/NĐ-CP dùng trao đổi nghiệp vụ, chỉ đạo triển khai công tác hoặc thông báo nhiệm vụ giữa cơ quan, tổ chức.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Công văn hành chính dựa trên các thông tin sau:
- Cơ quan chủ quản: {{co_quan_chu_quan}}
- Đơn vị ban hành: {{don_vi_ban_hanh}}
- Trích yếu công văn: {{trich_yeu}}
- Nơi nhận chính (Kính gửi): {{noi_nhan_chinh}}
- Căn cứ pháp lý: {{can_cu_phap_ly}}
- Nội dung chỉ đạo/thông báo: {{noi_dung}}
- Thời hạn báo cáo/hoàn thành: {{thoi_han}}
- Chức danh người ký: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "co_quan_chu_quan",
          label: "Tên cơ quan cấp trên / Cơ quan chủ quản",
          type: "text",
          required: false,
          placeholder: "Vd: BỘ THÔNG TIN VÀ TRUYỀN THÔNG",
        },
        {
          name: "don_vi_ban_hanh",
          label: "Tên cơ quan / Đơn vị ban hành công văn",
          type: "text",
          required: true,
          placeholder: "Vd: CỤC CHUYỂN ĐỔI SỐ QUỐC GIA",
          validation: { min_length: 3, max_length: 150 },
        },
        {
          name: "trich_yeu",
          label: "Trích yếu nội dung công văn",
          type: "text",
          required: true,
          placeholder: "Vd: V/v hướng dẫn rà soát an toàn thông tin hệ thống quý III/2026",
          validation: { min_length: 10, max_length: 300 },
        },
        {
          name: "noi_nhan_chinh",
          label: "Nơi nhận kính gửi",
          type: "text",
          required: true,
          placeholder: "Vd: Các Sở Thông tin và Truyền thông các tỉnh, thành phố trực thuộc Trung ương",
          validation: { min_length: 5 },
        },
        {
          name: "can_cu_phap_ly",
          label: "Căn cứ pháp lý / Văn bản chỉ đạo liên quan",
          type: "textarea",
          required: false,
          placeholder: "Vd: Luật An toàn thông tin mạng; Chỉ thị số 05/CT-TTg của Thủ tướng Chính phủ...",
        },
        {
          name: "noi_dung",
          label: "Nội dung chỉ đạo, hướng dẫn chi tiết",
          type: "textarea",
          required: true,
          placeholder: "Trình bày cụ thể các yêu cầu, nhiệm vụ cần thực hiện...",
          validation: { min_length: 20 },
        },
        {
          name: "thoi_han",
          label: "Thời hạn hoàn thành / Báo cáo kết quả",
          type: "date",
          required: true,
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người ký",
          type: "text",
          required: true,
          defaultValue: "CỤC TRƯỞNG",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người ký",
          type: "text",
          required: true,
          placeholder: "Vd: Trần Minh Tuấn",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ mẫu Công văn hướng dẫn an toàn thông tin",
        input: {
          co_quan_chu_quan: "BỘ THÔNG TIN VÀ TRUYỀN THÔNG",
          don_vi_ban_hanh: "CỤC CHUYỂN ĐỔI SỐ QUỐC GIA",
          trich_yeu: "V/v hướng dẫn rà soát an toàn thông tin hệ thống quý III/2026",
          noi_nhan_chinh: "Sở Thông tin và Truyền thông các tỉnh, thành phố trực thuộc Trung ương",
          can_cu_phap_ly: "Luật An toàn thông tin mạng số 86/2015/QH13; Nghị định số 85/2016/NĐ-CP của Chính phủ",
          noi_dung: "Đề nghị các đơn vị tiến hành kiểm tra tổng thể hệ thống tường lửa, cập nhật bản vá bảo mật cho các máy chủ dịch vụ công trực tuyến và sao lưu dữ liệu dự phòng định kỳ.",
          thoi_han: "2026-09-30",
          chuc_danh_nguoi_ky: "CỤC TRƯỞNG",
          ho_ten_nguoi_ky: "Trần Minh Tuấn",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>BỘ THÔNG TIN VÀ TRUYỀN THÔNG</strong><br/>
      <strong>CỤC CHUYỂN ĐỔI SỐ QUỐC GIA</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/CĐSQG-ATTT<br/>
      <em>V/v hướng dẫn rà soát an toàn thông tin hệ thống quý III/2026</em>
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Hà Nội, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<p style="margin-top:25px;"><strong>Kính gửi:</strong> Sở Thông tin và Truyền thông các tỉnh, thành phố trực thuộc Trung ương</p>

<p>Căn cứ Luật An toàn thông tin mạng số 86/2015/QH13;</p>
<p>Căn cứ Nghị định số 85/2016/NĐ-CP của Chính phủ về bảo đảm an toàn hệ thống thông tin theo cấp độ,</p>

<p>Nhằm chủ động phòng ngừa các sự cố an ninh mạng và đảm bảo an toàn tuyệt đối cho các hệ thống thông tin phục vụ chỉ đạo điều hành, Cục Chuyển đổi số quốc gia đề nghị Quý Sở khẩn trương phối hợp triển khai các nội dung sau:</p>

<p><strong>1.</strong> Tiến hành kiểm tra tổng thể hệ thống tường lửa, cập nhật bản vá bảo mật mới nhất cho các cổng dịch vụ công trực tuyến và hệ thống một cửa điện tử.</p>
<p><strong>2.</strong> Thực hiện quy trình sao lưu dữ liệu ngoại tuyến định kỳ, rà soát phân quyền quản trị người dùng trên tất cả các cơ sở dữ liệu dùng chung.</p>
<p><strong>3.</strong> Thiết lập kênh ứng cứu sự cố trực ban 24/7 và đầu mối liên hệ phối hợp kỹ thuật với Trung tâm Giám sát an toàn không gian mạng quốc gia.</p>

<p>Báo cáo kết quả rà soát đề nghị gửi về Cục Chuyển đổi số quốc gia trước ngày <strong>30 tháng 09 năm 2026</strong> (qua hệ thống quản lý văn bản điều hành điện tử và bản mềm qua thư điện tử).</p>

<p>Rất mong nhận được sự phối hợp chặt chẽ của Quý cơ quan./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; vertical-align:top; border:none;">
      <strong><em><u>Nơi nhận:</u></em></strong><br/>
      - Như kính gửi;<br/>
      - Bộ trưởng (để báo cáo);<br/>
      - Thứ trưởng phụ trách (để báo cáo);<br/>
      - Lưu: VT, ATTT.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>CỤC TRƯỞNG</strong><br/><br/><br/><br/>
      <strong>Trần Minh Tuấn</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 4.9,
  },

  // 3. QUYẾT ĐỊNH BỔ NHIỆM CÁN BỘ / LÃNH ĐẠO
  {
    id: "qd-bo-nhiem",
    categoryId: "hr",
    industryPack: "HR",
    title: "Quyết định bổ nhiệm cán bộ / lãnh đạo quản lý",
    description:
      "Mẫu Quyết định bổ nhiệm cán bộ, trưởng phó phòng ban theo chuẩn thể thức Nghị định 30/2020/NĐ-CP và Luật Doanh nghiệp / Cán bộ công chức.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Quyết định bổ nhiệm dựa trên các thông tin sau:
- Cơ quan ban hành: {{co_quan_ban_hanh}}
- Cấp trên trực tiếp: {{co_quan_cap_tren}}
- Người được bổ nhiệm: {{ho_ten_nguoi_duoc_bo_nhiem}}
- Chức danh hiện tại: {{chuc_danh_hien_tai}}
- Chức danh bổ nhiệm: {{chuc_danh_bo_nhiem}}
- Đơn vị công tác: {{don_vi_cong_tac}}
- Thời hạn bổ nhiệm: {{thoi_han_bo_nhiem}}
- Ngày có hiệu lực: {{ngay_hieu_luc}}
- Căn cứ pháp lý: {{can_cu_phap_ly}}
- Chức danh người ký: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "co_quan_cap_tren",
          label: "Tên cơ quan cấp trên / Tập đoàn chủ quản",
          type: "text",
          required: false,
          placeholder: "Vd: ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
        },
        {
          name: "co_quan_ban_hanh",
          label: "Tên cơ quan / Doanh nghiệp ban hành",
          type: "text",
          required: true,
          placeholder: "Vd: SỞ KẾ HOẠCH VÀ ĐẦU TƯ",
          validation: { min_length: 3, max_length: 150 },
        },
        {
          name: "ho_ten_nguoi_duoc_bo_nhiem",
          label: "Họ và tên nhân sự được bổ nhiệm",
          type: "text",
          required: true,
          placeholder: "Vd: Lê Thị Thảo",
        },
        {
          name: "chuc_danh_hien_tai",
          label: "Chức vụ / Công việc hiện tại",
          type: "text",
          required: true,
          placeholder: "Vd: Phó Trưởng phòng Hành chính - Tổ chức",
        },
        {
          name: "chuc_danh_bo_nhiem",
          label: "Chức vụ được bổ nhiệm mới",
          type: "text",
          required: true,
          placeholder: "Vd: Trưởng phòng Hành chính - Tổ chức",
        },
        {
          name: "don_vi_cong_tac",
          label: "Phòng ban / Đơn vị trực thuộc",
          type: "text",
          required: true,
          placeholder: "Vd: Phòng Hành chính - Tổ chức",
        },
        {
          name: "thoi_han_bo_nhiem",
          label: "Thời hạn bổ nhiệm",
          type: "select",
          required: true,
          defaultValue: "5_nam",
          options: [
            { value: "3_nam", label: "03 năm" },
            { value: "5_nam", label: "05 năm" },
            { value: "theo_nhiem_ky", label: "Theo nhiệm kỳ của Ban Lãnh đạo" },
          ],
        },
        {
          name: "ngay_hieu_luc",
          label: "Ngày có hiệu lực thi hành",
          type: "date",
          required: true,
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người có thẩm quyền ký",
          type: "text",
          required: true,
          defaultValue: "GIÁM ĐỐC SỞ",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người ký",
          type: "text",
          required: true,
          placeholder: "Vd: Hoàng Quốc Việt",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ Quyết định bổ nhiệm Trưởng phòng",
        input: {
          co_quan_cap_tren: "ỦY BAN NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH",
          co_quan_ban_hanh: "SỞ KẾ HOẠCH VÀ ĐẦU TƯ",
          ho_ten_nguoi_duoc_bo_nhiem: "Lê Thị Thảo",
          chuc_danh_hien_tai: "Phó Trưởng phòng Đăng ký kinh doanh",
          chuc_danh_bo_nhiem: "Trưởng phòng Đăng ký kinh doanh",
          don_vi_cong_tac: "Phòng Đăng ký kinh doanh",
          thoi_han_bo_nhiem: "5_nam",
          ngay_hieu_luc: "2026-07-01",
          chuc_danh_nguoi_ky: "GIÁM ĐỐC",
          ho_ten_nguoi_ky: "Hoàng Quốc Việt",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>UBND THÀNH PHỐ HỒ CHÍ MINH</strong><br/>
      <strong>SỞ KẾ HOẠCH VÀ ĐẦU TƯ</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/QĐ-SKHĐT
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Thành phố Hồ Chí Minh, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">QUYẾT ĐỊNH</h2>
<p style="text-align:center; font-weight:bold;">Về việc bổ nhiệm Trưởng phòng Đăng ký kinh doanh</p>

<p style="text-align:center;"><strong>GIÁM ĐỐC SỞ KẾ HOẠCH VÀ ĐẦU TƯ</strong></p>

<p>Căn cứ Luật Cán bộ, công chức số 22/2008/QH12 và Luật sửa đổi, bổ sung một số điều của Luật Cán bộ, công chức và Luật Viên chức số 52/2019/QH14;</p>
<p>Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;</p>
<p>Căn cứ Quyết định quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Sở Kế hoạch và Đầu tư;</p>
<p>Xét đề nghị của Trưởng phòng Tổ chức - Cán bộ,</p>

<h3 style="text-align:center;">QUYẾT ĐỊNH:</h3>

<p><strong>Điều 1.</strong> Bổ nhiệm bà <strong>Lê Thị Thảo</strong>, hiện là Phó Trưởng phòng Đăng ký kinh doanh, giữ chức vụ <strong>Trưởng phòng Đăng ký kinh doanh</strong>, Sở Kế hoạch và Đầu tư thành phố Hồ Chí Minh.</p>
<p>Thời hạn bổ nhiệm là 05 (năm) năm, kể từ ngày 01 tháng 07 năm 2026.</p>

<p><strong>Điều 2.</strong> Bà Lê Thị Thảo được hưởng lương chức danh và phụ cấp chức vụ lãnh đạo theo quy định hiện hành của Nhà nước.</p>

<p><strong>Điều 3.</strong> Chánh Văn phòng Sở, Trưởng phòng Tổ chức - Cán bộ, Trưởng phòng Kế hoạch - Tài chính, Trưởng các đơn vị có liên quan và bà Lê Thị Thảo chịu trách nhiệm thi hành Quyết định này./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; vertical-align:top; border:none;">
      <strong><em><u>Nơi nhận:</u></em></strong><br/>
      - Như Điều 3;<br/>
      - UBND thành phố (để báo cáo);<br/>
      - Sở Nội vụ thành phố;<br/>
      - Lưu: VT, TCCB.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>GIÁM ĐỐC</strong><br/><br/><br/><br/>
      <strong>Hoàng Quốc Việt</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 5.0,
  },

  // 4. BIÊN BẢN CUỘC HỌP GIAO BAN / CHUYÊN MÔN
  {
    id: "bien-ban-hop",
    categoryId: "enterprise",
    industryPack: "ENTERPRISE",
    title: "Biên bản cuộc họp giao ban / chuyên môn",
    description:
      "Mẫu Biên bản cuộc họp ghi nhận đầy đủ thành phần tham gia, diễn biến thảo luận, các quyết nghị và phân công giao việc theo chuẩn hành chính.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Biên bản cuộc họp dựa trên các thông tin sau:
- Tên đơn vị / Cơ quan: {{ten_don_vi}}
- Tiêu đề cuộc họp: {{tieu_de_hop}}
- Thời gian bắt đầu: {{thoi_gian_bat_dau}}
- Địa điểm tổ chức: {{dia_diem}}
- Chủ tọa: {{chu_toa}}
- Thư ký ghi biên bản: {{thu_ky}}
- Thành phần tham dự: {{thanh_phan_tham_du}}
- Nội dung diễn biến cuộc họp: {{noi_dung_hop}}
- Kết luận và phân công nhiệm vụ: {{ket_luan}}`,
    formSchema: {
      fields: [
        {
          name: "ten_don_vi",
          label: "Tên cơ quan / Công ty",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY CỔ PHẦN CÔNG NGHỆ VĂN BẢN DOCDRAFT",
          validation: { min_length: 3 },
        },
        {
          name: "tieu_de_hop",
          label: "Tiêu đề nội dung cuộc họp",
          type: "text",
          required: true,
          placeholder: "Vd: Cuộc họp giao ban đánh giá tiến độ quý II/2026 và kế hoạch quý III",
          validation: { min_length: 10 },
        },
        {
          name: "thoi_gian_bat_dau",
          label: "Thời gian bắt đầu họp",
          type: "text",
          required: true,
          placeholder: "Vd: 08 giờ 30 phút, ngày 15 tháng 06 năm 2026",
        },
        {
          name: "dia_diem",
          label: "Địa điểm tổ chức",
          type: "text",
          required: true,
          placeholder: "Vd: Phòng họp số 1 hoặc Trực tuyến qua Microsoft Teams",
        },
        {
          name: "chu_toa",
          label: "Chủ tọa (Họ tên, Chức vụ)",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Phạm Đức Long - Tổng Giám đốc",
        },
        {
          name: "thu_ky",
          label: "Thư ký (Họ tên, Chức vụ)",
          type: "text",
          required: true,
          placeholder: "Vd: Bà Nguyễn Thùy Trang - Chuyên viên Hành chính",
        },
        {
          name: "thanh_phan_tham_du",
          label: "Thành phần tham dự",
          type: "textarea",
          required: true,
          placeholder: "Ghi rõ các đại biểu, trưởng các phòng ban có mặt, vắng mặt...",
        },
        {
          name: "noi_dung_hop",
          label: "Tóm tắt diễn biến & thảo luận",
          type: "textarea",
          required: true,
          placeholder: "Các báo cáo được trình bày, ý kiến đóng góp của các thành viên...",
          validation: { min_length: 30 },
        },
        {
          name: "ket_luan",
          label: "Kết luận của Chủ tọa & Phân công nhiệm vụ",
          type: "textarea",
          required: true,
          placeholder: "Nêu các mốc thời gian hoàn thành cụ thể cho từng đầu việc...",
          validation: { min_length: 20 },
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ Biên bản họp giao ban công nghệ",
        input: {
          ten_don_vi: "CÔNG TY CỔ PHẦN DOCDRAFT AI",
          tieu_de_hop: "Họp giao ban rà soát tiến độ phát hành phiên bản MVP Phase 1",
          thoi_gian_bat_dau: "09 giờ 00 phút, ngày 20 tháng 06 năm 2026",
          dia_diem: "Phòng họp Lotus, Trụ sở chính Công ty",
          chu_toa: "Ông Phạm Đức Long - Tổng Giám đốc",
          thu_ky: "Bà Nguyễn Thùy Trang - Trợ lý Hành chính",
          thanh_phan_tham_du: "Có mặt: Trưởng phòng Kỹ thuật, Trưởng phòng Sản phẩm, Trưởng phòng Kinh doanh. Vắng: 0.",
          noi_dung_hop: "Trưởng phòng Kỹ thuật báo cáo đã hoàn thành việc tích hợp DeepSeek-V3 và Dynamic Form Engine. Trưởng phòng Sản phẩm đề xuất cải thiện thời gian phản hồi xuất file docx.",
          ket_luan: "Thống nhất đóng gói MVP vào ngày 30/06/2026. Giao Bộ phận Kỹ thuật tối ưu hóa bộ đệm Docx trước ngày 25/06/2026.",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>CÔNG TY CỔ PHẦN DOCDRAFT AI</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/BB-DDAI
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Hà Nội, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">BIÊN BẢN CUỘC HỌP</h2>
<p style="text-align:center; font-style:italic;">V/v Họp giao ban rà soát tiến độ phát hành phiên bản MVP Phase 1</p>

<p><strong>I. THỜI GIAN VÀ ĐỊA ĐIỂM:</strong></p>
<p>- Thời gian bắt đầu: 09 giờ 00 phút, ngày 20 tháng 06 năm 2026.</p>
<p>- Địa điểm: Phòng họp Lotus, Trụ sở chính Công ty.</p>

<p><strong>II. THÀNH PHẦN THAM DỰ:</strong></p>
<p>- <strong>Chủ tọa:</strong> Ông Phạm Đức Long - Tổng Giám đốc.</p>
<p>- <strong>Thư ký:</strong> Bà Nguyễn Thùy Trang - Trợ lý Hành chính.</p>
<p>- <strong>Thành viên tham dự:</strong> Trưởng phòng Kỹ thuật, Trưởng phòng Sản phẩm, Trưởng phòng Kinh doanh. Vắng mặt: 0.</p>

<p><strong>III. NỘI DUNG VÀ DIỄN BIẾN CUỘC HỌP:</strong></p>
<p><strong>1. Báo cáo của các bộ phận:</strong><br/>
Trưởng phòng Kỹ thuật báo cáo đã hoàn thành việc tích hợp DeepSeek-V3 và Dynamic Form Engine. Trưởng phòng Sản phẩm đề xuất cải thiện thời gian phản hồi xuất file docx.</p>
<p><strong>2. Ý kiến thảo luận:</strong><br/>
Các đại diện tham dự cuộc họp tập trung thảo luận về tính ổn định của hệ thống microservice và khả năng chịu tải khi người dùng tạo biểu mẫu đồng thời.</p>

<p><strong>IV. KẾT LUẬN CỦA CHỦ TỌA:</strong></p>
<p>Sau khi nghe ý kiến báo cáo và thảo luận của các bên, Chủ tọa cuộc họp kết luận:</p>
<p>1. Nhất trí nghiệm thu giai đoạn tích hợp Dynamic Form Engine và DeepSeek-V3 API.</p>
<p>2. Phân công Bộ phận Kỹ thuật hoàn thiện tối ưu hóa bộ đệm Document Service xuất docx/pdf trước ngày 25 tháng 06 năm 2026.</p>
<p>3. Toàn công ty chuẩn bị kế hoạch phát hành chính thức bản MVP vào ngày 30 tháng 06 năm 2026.</p>

<p>Biên bản kết thúc vào hồi 11 giờ 30 phút cùng ngày, đã được đọc lại cho toàn thể thành viên tham dự nghe và nhất trí thông qua./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>THƯ KÝ CUỘC HỌP</strong><br/><br/><br/><br/>
      <strong>Nguyễn Thùy Trang</strong>
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>CHỦ TỌA CUỘC HỌP</strong><br/><br/><br/><br/>
      <strong>Phạm Đức Long</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 4.8,
  },

  // 5. HỢP ĐỒNG DỊCH VỤ THƯƠNG MẠI
  {
    id: "hop-dong-dich-vu",
    categoryId: "enterprise",
    industryPack: "ENTERPRISE",
    title: "Hợp đồng dịch vụ thương mại",
    description:
      "Mẫu Hợp đồng cung ứng dịch vụ thương mại chuẩn Bộ luật Dân sự và Luật Thương mại với các điều khoản bảo mật, thanh toán và nghiệm thu chặt chẽ.",
    systemPrompt: `BẠN LÀ LUẬT SƯ THƯƠNG MẠI CÓ 15 NĂM KINH NGHIỆM TẠI VIỆT NAM.
Nhiệm vụ: Soạn thảo hợp đồng cung cấp dịch vụ thương mại chuyên nghiệp, bảo vệ quyền lợi hợp pháp của cả hai bên theo Bộ luật Dân sự 2015 và Luật Thương mại 2005.

QUY TẮC BẮT BUỘC:
1. KHÔNG tự ý bịa đặt số tài khoản ngân hàng, mã số thuế, số CCCD nếu chưa có trong input, bắt buộc bọc [...] cho các trường này.
2. Layout Quốc hiệu, Tiêu ngữ và Đại diện hai bên ký kết dùng table border:none.
3. Điều khoản gồm: Đối tượng hợp đồng, Phí dịch vụ & Thanh toán, Quyền & Nghĩa vụ hai bên, Phạt vi phạm, Giải quyết tranh chấp.
4. Output trả về 100% HTML ngữ nghĩa, không bọc markdown.`,
    userPromptTemplate: `Soạn thảo Hợp đồng dịch vụ thương mại theo các thông tin:
- Tên dịch vụ: {{ten_dich_vu}}
- Bên A (Bên thuê): {{ben_a_ten}}, Đại diện: {{ben_a_dai_dien}}
- Bên B (Bên cung cấp): {{ben_b_ten}}, Đại diện: {{ben_b_dai_dien}}
- Giá trị hợp đồng: {{gia_tri_hop_dong}}
- Phương thức thanh toán: {{phuong_thuc_thanh_toan}}
- Thời hạn thực hiện: {{thoi_han_thuc_hien}}
- Địa điểm thực hiện: {{dia_diem_thuc_hien}}`,
    formSchema: {
      fields: [
        {
          name: "ten_dich_vu",
          label: "Tên gói dịch vụ cung cấp",
          type: "text",
          required: true,
          placeholder: "Vd: Dịch vụ bảo trì và vận hành hệ thống phần mềm kế toán",
          validation: { min_length: 5 },
        },
        {
          name: "ben_a_ten",
          label: "Bên A (Bên sử dụng dịch vụ) - Tên công ty",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY TNHH ĐẦU TƯ & THƯƠNG MẠI NAM HÀ",
        },
        {
          name: "ben_a_dai_dien",
          label: "Bên A - Họ tên & Chức vụ đại diện",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Nguyễn Văn Nam - Giám đốc",
        },
        {
          name: "ben_b_ten",
          label: "Bên B (Bên cung cấp dịch vụ) - Tên công ty",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY CỔ PHẦN GIẢI PHÁP SỐ TECHCORP",
        },
        {
          name: "ben_b_dai_dien",
          label: "Bên B - Họ tên & Chức vụ đại diện",
          type: "text",
          required: true,
          placeholder: "Vd: Bà Trần Mai Anh - Tổng Giám đốc",
        },
        {
          name: "gia_tri_hop_dong",
          label: "Tổng giá trị hợp đồng (VNĐ, đã gồm VAT)",
          type: "currency",
          required: true,
          placeholder: "Vd: 120.000.000 VNĐ",
          validation: { min: 100000 },
        },
        {
          name: "phuong_thuc_thanh_toan",
          label: "Phương thức thanh toán",
          type: "select",
          required: true,
          defaultValue: "chuyen_khoan_3_dot",
          options: [
            { value: "chuyen_khoan_mot_lan", label: "Chuyển khoản 1 lần sau khi nghiệm thu" },
            { value: "chuyen_khoan_3_dot", label: "Chuyển khoản 03 đợt (Tạm ứng 30% - 40% - 30%)" },
            { value: "chuyen_khoan_theo_thang", label: "Chuyển khoản định kỳ hàng tháng" },
          ],
        },
        {
          name: "thoi_han_thuc_hien",
          label: "Thời hạn hợp đồng (tháng)",
          type: "text",
          required: true,
          placeholder: "Vd: 12 tháng kể từ ngày ký",
        },
        {
          name: "dia_diem_thuc_hien",
          label: "Địa điểm triển khai dịch vụ",
          type: "text",
          required: false,
          placeholder: "Vd: Trụ sở Bên A và thông qua hệ thống máy chủ đám mây",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ Hợp đồng dịch vụ bảo trì CNTT",
        input: {
          ten_dich_vu: "Dịch vụ Quản trị hạ tầng máy chủ và bảo mật ứng dụng",
          ben_a_ten: "CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ NAM HẢI",
          ben_a_dai_dien: "Ông Trần Quang Huy - Giám đốc",
          ben_b_ten: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THÔNG TIN CLOUDVIET",
          ben_b_dai_dien: "Bà Lê Thu Giang - Tổng Giám đốc",
          gia_tri_hop_dong: 180000000,
          phuong_thuc_thanh_toan: "chuyen_khoan_3_dot",
          thoi_han_thuc_hien: "12 tháng kể từ ngày 01/07/2026",
          dia_diem_thuc_hien: "Trụ sở Bên A và hệ thống từ xa",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:100%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────────────</span><br/>
      <em>Số: [SỐ HỢP ĐỒNG]/HĐDV-2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">HỢP ĐỒNG DỊCH VỤ</h2>
<p style="text-align:center; font-style:italic;">V/v Cung cấp Dịch vụ Quản trị hạ tầng máy chủ và bảo mật ứng dụng</p>

<p>Hôm nay, ngày [NGÀY] tháng [THÁNG] năm 2026, tại Hà Nội, chúng tôi gồm có:</p>

<p><strong>BÊN SỬ DỤNG DỊCH VỤ (BÊN A): CÔNG TY TNHH THƯƠNG MẠI QUỐC TẾ NAM HẢI</strong><br/>
- Mã số doanh nghiệp: [MÃ SỐ THUẾ BÊN A]<br/>
- Địa chỉ: [ĐỊA CHỈ TRỤ SỞ BÊN A]<br/>
- Đại diện: <strong>Ông Trần Quang Huy</strong> - Chức vụ: Giám đốc.<br/>
- Điện thoại: [SỐ ĐIỆN THOẠI] - Tài khoản: [SỐ TÀI KHOẢN TẠI NGÂN HÀNG].</p>

<p><strong>BÊN CUNG CẤP DỊCH VỤ (BÊN B): CÔNG TY CỔ PHẦN CÔNG NGHỆ THÔNG TIN CLOUDVIET</strong><br/>
- Mã số doanh nghiệp: [MÃ SỐ THUẾ BÊN B]<br/>
- Địa chỉ: [ĐỊA CHỈ TRỤ SỞ BÊN B]<br/>
- Đại diện: <strong>Bà Lê Thu Giang</strong> - Chức vụ: Tổng Giám đốc.<br/>
- Điện thoại: [SỐ ĐIỆN THOẠI] - Tài khoản: [SỐ TÀI KHOẢN TẠI NGÂN HÀNG].</p>

<p>Hai bên thỏa thuận ký kết Hợp đồng dịch vụ với các điều khoản sau:</p>

<p><strong>Điều 1. Phạm vi công việc:</strong><br/>
Bên B nhận cung cấp dịch vụ quản trị hạ tầng máy chủ, kiểm soát an toàn thông tin định kỳ và khắc phục sự cố kỹ thuật 24/7 theo cam kết chất lượng dịch vụ (SLA 99.9%).</p>

<p><strong>Điều 2. Giá trị hợp đồng và Phương thức thanh toán:</strong><br/>
- Tổng giá trị hợp đồng: <strong>180.000.000 VNĐ</strong> (Bằng chữ: Một trăm tám mươi triệu đồng chẵn, đã bao gồm thuế GTGT).<br/>
- Hình thức thanh toán: Chuyển khoản ngân hàng chia làm 03 đợt theo biên bản nghiệm thu từng giai đoạn.</p>

<p><strong>Điều 3. Thời hạn thực hiện:</strong><br/>
Hợp đồng có hiệu lực trong vòng 12 tháng kể từ ngày 01 tháng 07 năm 2026 đến hết ngày 30 tháng 06 năm 2027.</p>

<p><strong>Điều 4. Cam kết chung:</strong><br/>
Hai bên cam kết bảo mật tuyệt đối dữ liệu nghiệp vụ của nhau. Hợp đồng này được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN A</strong><br/><br/><br/><br/>
      <strong>Trần Quang Huy</strong>
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN B</strong><br/><br/><br/><br/>
      <strong>Lê Thu Giang</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 4.9,
  },

  // 6. GIẤY MỜI THAM DỰ HỘI NGHỊ / CUỘC HỌP
  {
    id: "giay-moi-hop",
    categoryId: "administrative",
    industryPack: "ADMINISTRATIVE",
    title: "Giấy mời tham dự hội nghị / cuộc họp",
    description:
      "Mẫu Giấy mời tham dự hội nghị, hội thảo hoặc buổi làm việc chính thức chuẩn quy cách thể thức hành chính Nhà nước.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Giấy mời họp theo các thông tin sau:
- Cơ quan mời: {{co_quan_moi}}
- Đại biểu được mời: {{kinh_gui}}
- Nội dung cuộc họp / hội thảo: {{noi_dung_hop}}
- Thời gian tổ chức: {{thoi_gian_to_chuc}}
- Địa điểm tổ chức: {{dia_diem_to_chuc}}
- Yêu cầu chuẩn bị: {{yeu_cau_chuan_bi}}
- Chức danh người ký: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "co_quan_moi",
          label: "Tên cơ quan phát hành giấy mời",
          type: "text",
          required: true,
          placeholder: "Vd: ỦY BAN NHÂN DÂN QUẬN HOÀN KIẾM",
          validation: { min_length: 3 },
        },
        {
          name: "kinh_gui",
          label: "Kính gửi (Cá nhân hoặc Cơ quan được mời)",
          type: "text",
          required: true,
          placeholder: "Vd: Đại diện Ban Giám đốc các Doanh nghiệp trên địa bàn quận",
        },
        {
          name: "noi_dung_hop",
          label: "Về việc / Nội dung cuộc họp",
          type: "text",
          required: true,
          placeholder: "Vd: Tham dự Hội nghị đối thoại tháo gỡ khó khăn cho doanh nghiệp năm 2026",
          validation: { min_length: 10 },
        },
        {
          name: "thoi_gian_to_chuc",
          label: "Thời gian diễn ra",
          type: "text",
          required: true,
          placeholder: "Vd: 08 giờ 00 phút, thứ Sáu, ngày 10 tháng 07 năm 2026",
        },
        {
          name: "dia_diem_to_chuc",
          label: "Địa điểm tổ chức",
          type: "text",
          required: true,
          placeholder: "Vd: Hội trường tầng 3, Trụ sở UBND Quận, số 126 phố Hàng Trống",
        },
        {
          name: "yeu_cau_chuan_bi",
          label: "Yêu cầu tài liệu chuẩn bị (nếu có)",
          type: "textarea",
          required: false,
          placeholder: "Vd: Mang theo Giấy mời và bản kiến nghị (nếu có) để nộp cho ban thư ký...",
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người ký",
          type: "text",
          required: true,
          defaultValue: "CHỦ TỊCH",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người ký",
          type: "text",
          required: true,
          placeholder: "Vd: Vũ Đăng Định",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ Giấy mời đối thoại doanh nghiệp",
        input: {
          co_quan_moi: "ỦY BAN NHÂN DÂN QUẬN HOÀN KIẾM",
          kinh_gui: "Đại diện Lãnh đạo các Doanh nghiệp trên địa bàn quận",
          noi_dung_hop: "Tham dự Hội nghị đối thoại tháo gỡ khó khăn cho doanh nghiệp quý III/2026",
          thoi_gian_to_chuc: "08 giờ 30 phút, ngày 15 tháng 07 năm 2026",
          dia_diem_to_chuc: "Hội trường lớn UBND quận Hoàn Kiếm, TP. Hà Nội",
          yeu_cau_chuan_bi: "Đại biểu chuẩn bị ý kiến bằng văn bản và xác nhận tham dự trước ngày 12/07/2026.",
          chuc_danh_nguoi_ky: "CHỦ TỊCH",
          ho_ten_nguoi_ky: "Vũ Đăng Định",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>ỦY BAN NHÂN DÂN QUẬN HOÀN KIẾM</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/GM-UBND
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Hoàn Kiếm, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">GIẤY MỜI</h2>
<p style="text-align:center; font-style:italic;">Tham dự Hội nghị đối thoại tháo gỡ khó khăn cho doanh nghiệp quý III/2026</p>

<p>Ủy ban nhân dân quận Hoàn Kiếm trân trọng kính mời:</p>
<p><strong>Kính gửi:</strong> Đại diện Lãnh đạo các Doanh nghiệp trên địa bàn quận</p>

<p><strong>1. Đến tham dự:</strong> Hội nghị đối thoại trực tiếp giữa Lãnh đạo UBND quận và cộng đồng doanh nghiệp nhằm lắng nghe, tháo gỡ kịp thời các vướng mắc về thủ tục hành chính, thuế và chuyển đổi số.</p>

<p><strong>2. Thời gian:</strong> 08 giờ 30 phút, ngày 15 tháng 07 năm 2026.</p>

<p><strong>3. Địa điểm:</strong> Hội trường lớn UBND quận Hoàn Kiếm, TP. Hà Nội.</p>

<p><strong>4. Công tác chuẩn bị:</strong> Đại biểu chuẩn bị ý kiến bằng văn bản và xác nhận tham dự trước ngày 12/07/2026 qua Văn phòng HĐND & UBND quận.</p>

<p>Rất mong sự hiện diện đầy đủ, đúng giờ của Quý đại biểu để buổi làm việc đạt kết quả tốt nhất./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; vertical-align:top; border:none;">
      <strong><em><u>Nơi nhận:</u></em></strong><br/>
      - Như kính gửi;<br/>
      - Thường trực Quận ủy (để báo cáo);<br/>
      - Lưu: VT.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>CHỦ TỊCH</strong><br/><br/><br/><br/>
      <strong>Vũ Đăng Định</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 4.7,
  },

  // 7. GIẤY ĐI ĐƯỜNG / LỆNH CÔNG TÁC
  {
    id: "giay-di-duong",
    categoryId: "administrative",
    industryPack: "ADMINISTRATIVE",
    title: "Giấy đi đường / Lệnh công tác",
    description:
      "Mẫu Giấy đi đường cho cán bộ công chức, chuyên viên đi công tác ngoại tỉnh để xác nhận lưu trú và thanh quyết toán công tác phí.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Giấy đi đường theo các thông tin sau:
- Cơ quan cấp: {{co_quan_cap}}
- Họ tên cán bộ đi công tác: {{ho_ten_can_bo}}
- Chức vụ, đơn vị: {{chuc_vu_phong_ban}}
- Mục đích công tác: {{muc_dich}}
- Nơi đến công tác: {{noi_den}}
- Thời gian đi và về: Từ {{ngay_di}} đến {{ngay_ve}}
- Phương tiện đi lại: {{phuong_tien}}
- Chức danh người phê duyệt: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "co_quan_cap",
          label: "Cơ quan / Đơn vị cử đi công tác",
          type: "text",
          required: true,
          placeholder: "Vd: VIỆN CHIẾN LƯỢC VÀ CHÍNH SÁCH TÀI CHÍNH",
        },
        {
          name: "ho_ten_can_bo",
          label: "Họ và tên cán bộ được cử",
          type: "text",
          required: true,
          placeholder: "Vd: Đặng Hải Đăng",
        },
        {
          name: "chuc_vu_phong_ban",
          label: "Chức danh & Phòng ban công tác",
          type: "text",
          required: true,
          placeholder: "Vd: Nghiên cứu viên chính, Ban Nghiên cứu Kinh tế vĩ mô",
        },
        {
          name: "muc_dich",
          label: "Nội dung & Mục đích công tác",
          type: "textarea",
          required: true,
          placeholder: "Vd: Khảo sát thực địa tình hình thu hút vốn FDI và chuyển giao công nghệ tại tỉnh Bình Dương",
        },
        {
          name: "noi_den",
          label: "Nơi đến công tác (Tỉnh/Thành phố/Đơn vị)",
          type: "text",
          required: true,
          placeholder: "Vd: Tỉnh Bình Dương và TP. Hồ Chí Minh",
        },
        {
          name: "ngay_di",
          label: "Ngày khởi hành",
          type: "date",
          required: true,
        },
        {
          name: "ngay_ve",
          label: "Ngày kết thúc đợt công tác",
          type: "date",
          required: true,
        },
        {
          name: "phuong_tien",
          label: "Phương tiện di chuyển",
          type: "select",
          required: true,
          defaultValue: "may_bay",
          options: [
            { value: "may_bay", label: "Máy bay (Hạng phổ thông)" },
            { value: "tau_hoa", label: "Tàu hỏa (Khoang nằm)" },
            { value: "xe_co_quan", label: "Xe ô tô cơ quan đưa đón" },
            { value: "xe_khach", label: "Xe khách liên tỉnh" },
          ],
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh Thủ trưởng duyệt",
          type: "text",
          required: true,
          defaultValue: "VIỆN TRƯỞNG",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên Thủ trưởng ký duyệt",
          type: "text",
          required: true,
          placeholder: "Vd: PGS.TS. Nguyễn Trọng Hoài",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ Giấy đi đường khảo sát kinh tế",
        input: {
          co_quan_cap: "VIỆN CHIẾN LƯỢC VÀ CHÍNH SÁCH TÀI CHÍNH",
          ho_ten_can_bo: "Đặng Hải Đăng",
          chuc_vu_phong_ban: "Nghiên cứu viên chính, Ban Nghiên cứu Vĩ mô",
          muc_dich: "Khảo sát thực địa chính sách thuế và ưu đãi đầu tư đối với doanh nghiệp bán dẫn",
          noi_den: "Sở Kế hoạch và Đầu tư tỉnh Bình Dương",
          ngay_di: "2026-08-10",
          ngay_ve: "2026-08-14",
          phuong_tien: "may_bay",
          chuc_danh_nguoi_ky: "VIỆN TRƯỞNG",
          ho_ten_nguoi_ky: "Nguyễn Trọng Hoài",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>BỘ TÀI CHÍNH</strong><br/>
      <strong>VIỆN CHIẾN LƯỢC &amp; CSTC</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/GĐĐ
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Hà Nội, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">GIẤY ĐI ĐƯỜNG</h2>

<p>Cấp cho cán bộ:</p>
<p>- Họ và tên: <strong>Đặng Hải Đăng</strong></p>
<p>- Chức vụ, đơn vị công tác: Nghiên cứu viên chính, Ban Nghiên cứu Vĩ mô.</p>
<p>- Được cử đi công tác tại: <strong>Sở Kế hoạch và Đầu tư tỉnh Bình Dương</strong>.</p>
<p>- Mục đích chuyến công tác: Khảo sát thực địa chính sách thuế và ưu đãi đầu tư đối với doanh nghiệp bán dẫn.</p>
<p>- Thời gian công tác: Từ ngày 10 tháng 08 năm 2026 đến hết ngày 14 tháng 08 năm 2026.</p>
<p>- Phương tiện sử dụng: Máy bay (Hạng phổ thông) và phương tiện công cộng tại địa phương.</p>

<p>Yêu cầu các cơ quan, đơn vị nơi cán bộ đến công tác tạo điều kiện giúp đỡ và xác nhận ngày đến, ngày đi để cán bộ làm thủ tục thanh toán theo quy định./.</p>

<table style="width:100%; border:1px solid #000; border-collapse:collapse; margin-top:20px;">
  <tr>
    <th style="border:1px solid #000; padding:6px;">Nơi đi và nơi đến</th>
    <th style="border:1px solid #000; padding:6px;">Ngày đi</th>
    <th style="border:1px solid #000; padding:6px;">Ngày đến</th>
    <th style="border:1px solid #000; padding:6px;">Phương tiện</th>
    <th style="border:1px solid #000; padding:6px;">Ký xác nhận nơi đến</th>
  </tr>
  <tr>
    <td style="border:1px solid #000; padding:8px;">Hà Nội đi Bình Dương</td>
    <td style="border:1px solid #000; padding:8px; text-align:center;">10/08/2026</td>
    <td style="border:1px solid #000; padding:8px; text-align:center;">10/08/2026</td>
    <td style="border:1px solid #000; padding:8px; text-align:center;">Máy bay</td>
    <td style="border:1px solid #000; padding:8px;">[ĐƠN VỊ KÝ ĐÓNG DẤU]</td>
  </tr>
  <tr>
    <td style="border:1px solid #000; padding:8px;">Bình Dương về Hà Nội</td>
    <td style="border:1px solid #000; padding:8px; text-align:center;">14/08/2026</td>
    <td style="border:1px solid #000; padding:8px; text-align:center;">14/08/2026</td>
    <td style="border:1px solid #000; padding:8px; text-align:center;">Máy bay</td>
    <td style="border:1px solid #000; padding:8px;">[ĐƠN VỊ KÝ ĐÓNG DẤU]</td>
  </tr>
</table>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; vertical-align:top; border:none;">
      <strong><em><u>Nơi nhận:</u></em></strong><br/>
      - Cán bộ đi công tác;<br/>
      - Phòng Tài chính - Kế toán;<br/>
      - Lưu: VT.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>VIỆN TRƯỞNG</strong><br/><br/><br/><br/>
      <strong>Nguyễn Trọng Hoài</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 4.8,
  },

  // 8. BÁO CÁO TIẾN ĐỘ DỰ ÁN
  {
    id: "bao-cao-tien-do",
    categoryId: "construction",
    industryPack: "CONSTRUCTION",
    title: "Báo cáo tiến độ thực hiện nhiệm vụ / dự án",
    description:
      "Mẫu Báo cáo định kỳ tình hình triển khai công trình/dự án, tỷ lệ giải ngân, các vướng mắc và kế hoạch tuần/tháng tiếp theo.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Báo cáo tiến độ thực hiện dự án theo các thông tin:
- Đơn vị báo cáo: {{don_vi_bao_cao}}
- Cơ quan tiếp nhận: {{co_quan_tiep_nhan}}
- Tên dự án / gói thầu: {{ten_du_an}}
- Kỳ báo cáo: {{ky_bao_cao}}
- Tỷ lệ hoàn thành (%): {{ty_le_hoan_thanh}}
- Các hạng mục đã thực hiện: {{hang_muc_da_lam}}
- Khó khăn, vướng mắc: {{vuong_mac}}
- Đề xuất kiến nghị: {{kien_nghi}}
- Chức danh người ký: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "don_vi_bao_cao",
          label: "Tên Ban Quản lý / Đơn vị thực hiện báo cáo",
          type: "text",
          required: true,
          placeholder: "Vd: BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG CÔNG TRÌNH GIAO THÔNG",
        },
        {
          name: "co_quan_tiep_nhan",
          label: "Cơ quan cấp trên nhận báo cáo (Kính gửi)",
          type: "text",
          required: true,
          placeholder: "Vd: Ủy ban nhân dân tỉnh Đồng Nai",
        },
        {
          name: "ten_du_an",
          label: "Tên dự án / Công trình",
          type: "text",
          required: true,
          placeholder: "Vd: Dự án Nâng cấp, mở rộng Tỉnh lộ 769 đoạn qua huyện Long Thành",
          validation: { min_length: 10 },
        },
        {
          name: "ky_bao_cao",
          label: "Kỳ báo cáo",
          type: "select",
          required: true,
          defaultValue: "thang",
          options: [
            { value: "tuan", label: "Báo cáo tiến độ tuần" },
            { value: "thang", label: "Báo cáo tiến độ tháng" },
            { value: "quy", label: "Báo cáo tiến độ quý" },
            { value: "nam", label: "Báo cáo tổng kết năm" },
          ],
        },
        {
          name: "ty_le_hoan_thanh",
          label: "Tỷ lệ khối lượng hoàn thành lũy kế (%)",
          type: "number",
          required: true,
          defaultValue: 45,
          validation: { min: 0, max: 100 },
        },
        {
          name: "hang_muc_da_lam",
          label: "Các hạng mục công việc đã hoàn thành",
          type: "textarea",
          required: true,
          placeholder: "Nêu chi tiết khối lượng thi công, giá trị giải ngân đạt được...",
          validation: { min_length: 20 },
        },
        {
          name: "vuong_mac",
          label: "Khó khăn, vướng mắc phát sinh",
          type: "textarea",
          required: false,
          placeholder: "Vd: Vấn đề mặt bằng, di dời đường điện trung thế, nguồn cung vật liệu đất đắp...",
        },
        {
          name: "kien_nghi",
          label: "Đề xuất, kiến nghị giải pháp",
          type: "textarea",
          required: true,
          placeholder: "Vd: Đề nghị Hội đồng bồi thường sớm bàn giao 2km mặt bằng còn lại...",
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người ký",
          type: "text",
          required: true,
          defaultValue: "GIÁM ĐỐC BAN",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người ký",
          type: "text",
          required: true,
          placeholder: "Vd: Võ Tấn Nhẫn",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ Báo cáo tiến độ thi công công trình giao thông",
        input: {
          don_vi_bao_cao: "BAN QLDA ĐẦU TƯ XÂY DỰNG GIAO THÔNG",
          co_quan_tiep_nhan: "Ủy ban nhân dân tỉnh Đồng Nai",
          ten_du_an: "Dự án Nâng cấp, mở rộng Tỉnh lộ 769 đoạn qua huyện Long Thành",
          ky_bao_cao: "thang",
          ty_le_hoan_thanh: 65,
          hang_muc_da_lam: "Đã hoàn thành thảm bê tông nhựa hạt trung 12km, hoàn thành đúc dầm cầu Suối Nước Trong và lắp đặt hệ thống thoát nước dọc tuyến.",
          vuong_mac: "Còn vướng 500m mặt bằng chưa giải tỏa tại nút giao QL51 do chưa thống nhất đơn giá bồi thường cây trồng.",
          kien_nghi: "Kính đề nghị UBND tỉnh chỉ đạo Trung tâm Phát triển Quỹ đất huyện Long Thành hoàn thành bàn giao toàn bộ mặt bằng trong tháng tới.",
          chuc_danh_nguoi_ky: "GIÁM ĐỐC",
          ho_ten_nguoi_ky: "Võ Tấn Nhẫn",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>UBND TỈNH ĐỒNG NAI</strong><br/>
      <strong>BAN QLDA GIAO THÔNG</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/BC-BQLDA
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Đồng Nai, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">BÁO CÁO</h2>
<p style="text-align:center; font-style:italic;">Tiến độ thực hiện Dự án Nâng cấp, mở rộng Tỉnh lộ 769 đoạn qua huyện Long Thành</p>

<p><strong>Kính gửi:</strong> Ủy ban nhân dân tỉnh Đồng Nai</p>

<p>Thực hiện nhiệm vụ được giao, Ban Quản lý dự án đầu tư xây dựng giao thông tỉnh trân trọng báo cáo tình hình triển khai Dự án Nâng cấp, mở rộng Tỉnh lộ 769 với các nội dung chi tiết như sau:</p>

<p><strong>I. TỔNG QUAN TIẾN ĐỘ DỰ ÁN:</strong><br/>
- Tỷ lệ khối lượng hoàn thành lũy kế: Đạt <strong>65%</strong> giá trị hợp đồng xây lắp.<br/>
- Tình hình giải ngân vốn: Lũy kế giải ngân đạt [SỐ TIỀN GIẢI NGÂN] VNĐ (đạt [TỶ LỆ GIẢI NGÂN]% kế hoạch vốn năm 2026).</p>

<p><strong>II. KẾT QUẢ TRIỂN KHAI CỤ THỂ:</strong><br/>
Đã hoàn thành thảm bê tông nhựa hạt trung 12km, hoàn thành đúc dầm cầu Suối Nước Trong và lắp đặt hệ thống thoát nước dọc tuyến.</p>

<p><strong>III. KHÓ KHĂN VÀ VƯỚNG MẮC:</strong><br/>
Hiện tại dự án còn vướng 500m mặt bằng chưa giải tỏa tại nút giao QL51 do chưa thống nhất đơn giá bồi thường cây trồng của một số hộ dân.</p>

<p><strong>IV. ĐỀ XUẤT VÀ KIẾN NGHỊ:</strong><br/>
Kính đề nghị UBND tỉnh chỉ đạo Trung tâm Phát triển Quỹ đất huyện Long Thành khẩn trương phê duyệt phương án đền bù bổ sung để hoàn thành bàn giao toàn bộ mặt bằng trong tháng tới.</p>

<p>Ban Quản lý dự án kính báo cáo UBND tỉnh xem xét, chỉ đạo./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; vertical-align:top; border:none;">
      <strong><em><u>Nơi nhận:</u></em></strong><br/>
      - Như kính gửi;<br/>
      - Sở Giao thông Vận tải;<br/>
      - Sở Kế hoạch và Đầu tư;<br/>
      - Lưu: VT, ĐHDA.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>GIÁM ĐỐC</strong><br/><br/><br/><br/>
      <strong>Võ Tấn Nhẫn</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 4.8,
  },

  // 9. THÔNG BÁO NỘI BỘ DOANH NGHIỆP / CƠ QUAN
  {
    id: "thong-bao-noi-bo",
    categoryId: "administrative",
    industryPack: "ADMINISTRATIVE",
    title: "Thông báo nội bộ cơ quan / doanh nghiệp",
    description:
      "Mẫu Thông báo nội bộ dùng ban hành các thông tin chung, lịch nghỉ lễ, điều chỉnh nội quy, hoặc triển khai kế hoạch trong cơ quan, tổ chức.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Thông báo nội bộ với các thông tin:
- Tên cơ quan / Công ty: {{ten_co_quan}}
- Tiêu đề thông báo: {{tieu_de_thong_bao}}
- Căn cứ thông báo: {{can_cu}}
- Nội dung thông báo: {{noi_dung_thong_bao}}
- Đối tượng áp dụng: {{doi_tuong_ap_dung}}
- Thời gian áp dụng / hiệu lực: {{thoi_gian_hieu_luc}}
- Chức danh người ký: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "ten_co_quan",
          label: "Tên cơ quan / Doanh nghiệp ban hành",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY CỔ PHẦN CÔNG NGHỆ THÔNG TIN VIỆT Á",
        },
        {
          name: "tieu_de_thong_bao",
          label: "Tiêu đề thông báo",
          type: "text",
          required: true,
          placeholder: "Vd: V/v lịch nghỉ lễ Quốc khánh 02/9 và sắp xếp nhân sự trực kỹ thuật",
          validation: { min_length: 10 },
        },
        {
          name: "can_cu",
          label: "Căn cứ ban hành (Luật Lao động / Nội quy)",
          type: "text",
          required: false,
          placeholder: "Vd: Căn cứ Bộ luật Lao động 2019 và Quy chế hoạt động nội bộ công ty",
        },
        {
          name: "noi_dung_thong_bao",
          label: "Nội dung chi tiết thông báo",
          type: "textarea",
          required: true,
          placeholder: "Trình bày cụ thể thời gian bắt đầu, kết thúc, các quy định trực ca...",
          validation: { min_length: 20 },
        },
        {
          name: "doi_tuong_ap_dung",
          label: "Đối tượng áp dụng thi hành",
          type: "text",
          required: true,
          defaultValue: "Toàn thể cán bộ, công nhân viên trong toàn Công ty",
        },
        {
          name: "thoi_gian_hieu_luc",
          label: "Thời gian có hiệu lực",
          type: "date",
          required: true,
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người ký",
          type: "text",
          required: true,
          defaultValue: "TỔNG GIÁM ĐỐC",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người ký",
          type: "text",
          required: true,
          placeholder: "Vd: Bùi Quốc Anh",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ Thông báo nghỉ lễ Quốc khánh",
        input: {
          ten_co_quan: "CÔNG TY CỔ PHẦN CÔNG NGHỆ THÔNG TIN VIỆT Á",
          tieu_de_thong_bao: "V/v lịch nghỉ lễ Quốc khánh 02/9 năm 2026",
          can_cu: "Bộ luật Lao động năm 2019 và Kế hoạch hoạt động sản xuất kinh doanh năm 2026",
          noi_dung_thong_bao: "Toàn thể CBNV được nghỉ liên tục 04 ngày, từ thứ Bảy ngày 29/08/2026 đến hết thứ Ba ngày 01/09/2026. Bộ phận Kỹ thuật và Vận hành phân công trực 24/7 theo lịch đính kèm.",
          doi_tuong_ap_dung: "Toàn thể cán bộ, công nhân viên các phòng ban và chi nhánh",
          thoi_gian_hieu_luc: "2026-08-20",
          chuc_danh_nguoi_ky: "TỔNG GIÁM ĐỐC",
          ho_ten_nguoi_ky: "Bùi Quốc Anh",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>CÔNG TY CP CNTT VIỆT Á</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/TB-VA
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Hà Nội, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">THÔNG BÁO</h2>
<p style="text-align:center; font-style:italic;">V/v lịch nghỉ lễ Quốc khánh 02/9 năm 2026</p>

<p>Căn cứ quy định của Bộ luật Lao động số 45/2019/QH14;</p>
<p>Căn cứ Kế hoạch sản xuất kinh doanh năm 2026 của Công ty Cổ phần Công nghệ Thông tin Việt Á,</p>

<p>Tổng Giám đốc Công ty trân trọng thông báo tới toàn thể cán bộ, công nhân viên lịch nghỉ lễ Quốc khánh 02/9 như sau:</p>

<p><strong>1. Thời gian nghỉ lễ:</strong><br/>
- Toàn thể CBNV được nghỉ liên tục 04 ngày, từ thứ Bảy ngày 29/08/2026 đến hết thứ Ba ngày 01/09/2026.<br/>
- Thứ Tư ngày 02/09/2026 là ngày Quốc khánh chính thức, công ty bắt đầu làm việc bình thường trở lại từ ngày 03/09/2026.</p>

<p><strong>2. Công tác đảm bảo an toàn và vận hành:</strong><br/>
- Bộ phận Kỹ thuật và Vận hành phân công trực 24/7 theo danh sách trực ca đính kèm để duy trì liên tục hệ thống dịch vụ khách hàng.<br/>
- Cán bộ nhân viên trước khi nghỉ lễ có trách nhiệm kiểm tra, ngắt toàn bộ thiết bị điện không cần thiết và niêm phong cửa văn phòng.</p>

<p>Yêu cầu Trưởng các phòng ban, Giám đốc các chi nhánh phổ biến Thông báo này đến toàn thể người lao động nghiêm túc thực hiện./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; vertical-align:top; border:none;">
      <strong><em><u>Nơi nhận:</u></em></strong><br/>
      - Toàn thể CBNV;<br/>
      - Ban Giám đốc (để chỉ đạo);<br/>
      - Lưu: VT, HCNS.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>TỔNG GIÁM ĐỐC</strong><br/><br/><br/><br/>
      <strong>Bùi Quốc Anh</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 4.9,
  },

  // 10. QUYẾT ĐỊNH THÀNH LẬP TỔ CÔNG TÁC / BAN CHỈ ĐẠO
  {
    id: "qd-thanh-lap-to-cong-tac",
    categoryId: "administrative",
    industryPack: "ADMINISTRATIVE",
    title: "Quyết định thành lập Tổ công tác / Ban chỉ đạo",
    description:
      "Mẫu Quyết định thành lập Ban chỉ đạo, Tổ công tác thực hiện nhiệm vụ hoặc dự án đặc thù với cơ cấu nhân sự và trách nhiệm rõ ràng.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Quyết định thành lập Tổ công tác với thông tin:
- Cơ quan ban hành: {{co_quan_ban_hanh}}
- Tên Tổ công tác / Ban chỉ đạo: {{ten_to_cong_tac}}
- Mục đích thành lập: {{muc_dich}}
- Tổ trưởng: {{to_truong}}
- Tổ phó: {{to_pho}}
- Các thành viên: {{thanh_vien}}
- Nhiệm vụ và quyền hạn: {{nhiem_vu}}
- Thời gian hoạt động: {{thoi_gian_hoat_dong}}
- Chức danh người ký: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "co_quan_ban_hanh",
          label: "Tên cơ quan / Tổ chức ban hành quyết định",
          type: "text",
          required: true,
          placeholder: "Vd: TỔNG CỤC THUẾ",
          validation: { min_length: 3 },
        },
        {
          name: "ten_to_cong_tac",
          label: "Tên Tổ công tác / Ban chỉ đạo",
          type: "text",
          required: true,
          placeholder: "Vd: Tổ công tác triển khai Đề án Hóa đơn điện tử khởi tạo từ máy tính tiền",
          validation: { min_length: 10 },
        },
        {
          name: "muc_dich",
          label: "Mục đích thành lập",
          type: "textarea",
          required: true,
          placeholder: "Nêu rõ mục đích, tính cấp thiết và kết quả đầu ra kỳ vọng...",
        },
        {
          name: "to_truong",
          label: "Tổ trưởng (Họ tên, Chức vụ)",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Nguyễn Văn Đức - Phó Tổng cục trưởng",
        },
        {
          name: "to_pho",
          label: "Tổ phó thường trực (Họ tên, Chức vụ)",
          type: "text",
          required: true,
          placeholder: "Vd: Bà Phan Thị Minh - Cục trưởng Cục CNTT",
        },
        {
          name: "thanh_vien",
          label: "Danh sách các ủy viên / thành viên",
          type: "textarea",
          required: true,
          placeholder: "Liệt kê danh sách nhân sự đại diện các phòng ban liên quan...",
        },
        {
          name: "nhiem_vu",
          label: "Nhiệm vụ và quyền hạn của Tổ công tác",
          type: "textarea",
          required: true,
          placeholder: "Xây dựng kế hoạch, đôn đốc các Cục Thuế địa phương, giải quyết vướng mắc...",
          validation: { min_length: 20 },
        },
        {
          name: "thoi_gian_hoat_dong",
          label: "Thời hạn hoạt động",
          type: "text",
          required: true,
          defaultValue: "Tổ công tác tự giải thể sau khi hoàn thành nhiệm vụ",
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người ký",
          type: "text",
          required: true,
          defaultValue: "TỔNG CỤC TRƯỞNG",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người ký",
          type: "text",
          required: true,
          placeholder: "Vd: Mai Xuân Thành",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Ví dụ Quyết định thành lập Tổ công tác CNTT",
        input: {
          co_quan_ban_hanh: "TỔNG CỤC THUẾ",
          ten_to_cong_tac: "Tổ công tác triển khai Đề án Hóa đơn điện tử khởi tạo từ máy tính tiền",
          muc_dich: "Chỉ đạo, hướng dẫn và đôn đốc toàn diện việc áp dụng hóa đơn điện tử cho các hộ kinh doanh bán lẻ trên toàn quốc.",
          to_truong: "Ông Nguyễn Văn Đức - Phó Tổng cục trưởng",
          to_pho: "Bà Phan Thị Minh - Cục trưởng Cục CNTT",
          thanh_vien: "- Đại diện Vụ Doanh nghiệp nhỏ và vừa;\n- Đại diện Vụ Quản lý thuế TNCN;\n- Đại diện Cục CNTT.",
          nhiem_vu: "Chỉ đạo xây dựng tài liệu kỹ thuật, tổ chức các đoàn kiểm tra liên ngành và định kỳ báo cáo lãnh đạo Bộ Tài chính.",
          thoi_gian_hoat_dong: "Tổ công tác tự giải thể sau khi hoàn thành nhiệm vụ.",
          chuc_danh_nguoi_ky: "TỔNG CỤC TRƯỞNG",
          ho_ten_nguoi_ky: "Mai Xuân Thành",
        },
        output_html: `<table style="width:100%; border:none;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <strong>BỘ TÀI CHÍNH</strong><br/>
      <strong>TỔNG CỤC THUẾ</strong><br/>
      <span>───────</span><br/>
      Số: [SỐ KÝ HIỆU]/QĐ-TCT
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
      <strong><u>Độc lập - Tự do - Hạnh phúc</u></strong><br/>
      <span>───────────────</span><br/>
      <em>Hà Nội, ngày [NGÀY] tháng [THÁNG] năm 2026</em>
    </td>
  </tr>
</table>

<h2 style="text-align:center; margin-top:20px;">QUYẾT ĐỊNH</h2>
<p style="text-align:center; font-weight:bold;">Về việc thành lập Tổ công tác triển khai Đề án Hóa đơn điện tử khởi tạo từ máy tính tiền</p>

<p style="text-align:center;"><strong>TỔNG CỤC TRƯỞNG TỔNG CỤC THUẾ</strong></p>

<p>Căn cứ Luật Quản lý thuế số 38/2019/QH14;</p>
<p>Căn cứ Nghị định số 123/2020/NĐ-CP của Chính phủ quy định về hóa đơn, chứng từ;</p>
<p>Căn cứ Quyết định số 41/2018/QĐ-TTg của Thủ tướng Chính phủ quy định chức năng, nhiệm vụ, quyền hạn và cơ cấu tổ chức của Tổng cục Thuế;</p>
<p>Theo đề nghị của Vụ trưởng Vụ Tổ chức cán bộ và Cục trưởng Cục Công nghệ Thông tin,</p>

<h3 style="text-align:center;">QUYẾT ĐỊNH:</h3>

<p><strong>Điều 1.</strong> Thành lập <strong>Tổ công tác triển khai Đề án Hóa đơn điện tử khởi tạo từ máy tính tiền</strong> (sau đây gọi tắt là Tổ công tác) gồm các thành viên sau:</p>
<p>1. <strong>Tổ trưởng:</strong> Ông Nguyễn Văn Đức - Phó Tổng cục trưởng.</p>
<p>2. <strong>Tổ phó thường trực:</strong> Bà Phan Thị Minh - Cục trưởng Cục Công nghệ Thông tin.</p>
<p>3. <strong>Các thành viên:</strong> Đại diện Lãnh đạo Vụ Doanh nghiệp nhỏ và vừa; Vụ Quản lý thuế TNCN; Cục CNTT.</p>

<p><strong>Điều 2.</strong> Nhiệm vụ và quyền hạn của Tổ công tác:<br/>
- Chỉ đạo xây dựng tài liệu kỹ thuật, hướng dẫn các Cục Thuế địa phương triển khai đồng bộ.<br/>
- Tổ chức các đoàn kiểm tra giám sát liên ngành và định kỳ tổng hợp kết quả báo cáo Lãnh đạo Bộ Tài chính.<br/>
- Tổ công tác tự giải thể sau khi hoàn thành nhiệm vụ.</p>

<p><strong>Điều 3.</strong> Quyết định này có hiệu lực kể từ ngày ký. Thủ trưởng các đơn vị thuộc, trực thuộc Tổng cục Thuế và các ông/bà có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này./.</p>

<table style="width:100%; border:none; margin-top:30px;">
  <tr>
    <td style="width:50%; vertical-align:top; border:none;">
      <strong><em><u>Nơi nhận:</u></em></strong><br/>
      - Như Điều 3;<br/>
      - Bộ Tài chính (để báo cáo);<br/>
      - Lưu: VT, TCCB.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>TỔNG CỤC TRƯỞNG</strong><br/><br/><br/><br/>
      <strong>Mai Xuân Thành</strong>
    </td>
  </tr>
</table>`,
      },
    ],
    exportConfig: {
      margins: { top: 20, bottom: 20, left: 30, right: 15 },
      defaultFont: "Times New Roman",
      fontSize: 13,
    },
    isBuiltin: true,
    isPublished: true,
    avgRating: 5.0,
  },
];
