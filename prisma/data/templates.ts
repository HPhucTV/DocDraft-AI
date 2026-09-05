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

  // 11. THỎA THUẬN BẢO MẬT THÔNG TIN (NDA) - SME PACK (TASK-212)
  {
    id: "thoa-thuan-bao-mat-nda",
    categoryId: "enterprise",
    industryPack: "SME",
    title: "Thỏa thuận bảo mật thông tin (NDA)",
    description: "Thỏa thuận bảo mật thông tin kinh doanh, dữ liệu kỹ thuật và bí mật thương mại giữa hai doanh nghiệp đối tác theo Bộ luật Dân sự 2015.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Thỏa thuận bảo mật thông tin (NDA) theo các thông tin sau:
- Tên Bên tiết lộ (Bên A): {{ben_a_ten}}
- Mã số thuế Bên A: {{ben_a_mst}}
- Đại diện Bên A: {{ben_a_dai_dien}} (Chức vụ: {{ben_a_chuc_vu}})
- Tên Bên tiếp nhận (Bên B): {{ben_b_ten}}
- Mã số thuế Bên B: {{ben_b_mst}}
- Đại diện Bên B: {{ben_b_dai_dien}} (Chức vụ: {{ben_b_chuc_vu}})
- Mục đích hợp tác: {{muc_dich_hop_tac}}
- Phạm vi thông tin bảo mật: {{pham_vi_thong_tin}}
- Thời hạn bảo mật: {{thoi_han_bao_mat}} năm
- Chế tài vi phạm: {{che_tai_vi_pham}}`,
    formSchema: {
      fields: [
        {
          name: "ben_a_ten",
          label: "Bên tiết lộ thông tin (Bên A)",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM",
          validation: { min_length: 3, max_length: 200 },
        },
        {
          name: "ben_a_mst",
          label: "Mã số thuế Bên A",
          type: "text",
          required: true,
          placeholder: "Vd: 0109876543",
        },
        {
          name: "ben_a_dai_dien",
          label: "Đại diện Bên A",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Nguyễn Văn An",
        },
        {
          name: "ben_a_chuc_vu",
          label: "Chức vụ đại diện Bên A",
          type: "text",
          required: true,
          placeholder: "Vd: Tổng Giám đốc",
        },
        {
          name: "ben_b_ten",
          label: "Bên tiếp nhận thông tin (Bên B)",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY TNHH GIẢI PHÁP PHẦN MỀM TECHPRO",
          validation: { min_length: 3, max_length: 200 },
        },
        {
          name: "ben_b_mst",
          label: "Mã số thuế Bên B",
          type: "text",
          required: true,
          placeholder: "Vd: 0312345678",
        },
        {
          name: "ben_b_dai_dien",
          label: "Đại diện Bên B",
          type: "text",
          required: true,
          placeholder: "Vd: Bà Trần Thị Mai",
        },
        {
          name: "ben_b_chuc_vu",
          label: "Chức vụ đại diện Bên B",
          type: "text",
          required: true,
          placeholder: "Vd: Giám đốc điều hành",
        },
        {
          name: "muc_dich_hop_tac",
          label: "Mục đích chia sẻ thông tin",
          type: "text",
          required: true,
          placeholder: "Vd: Đánh giá khả thi tích hợp giải pháp DocDraft AI vào hạ tầng doanh nghiệp",
        },
        {
          name: "pham_vi_thong_tin",
          label: "Phạm vi thông tin bảo mật",
          type: "textarea",
          required: false,
          placeholder: "Vd: Mã nguồn, cấu trúc dữ liệu, tài liệu API, bảng giá chiết khấu, danh sách khách hàng...",
        },
        {
          name: "thoi_han_bao_mat",
          label: "Thời hạn hiệu lực bảo mật (năm)",
          type: "number",
          required: true,
          placeholder: "3",
        },
        {
          name: "che_tai_vi_pham",
          label: "Mức phạt hoặc chế tài vi phạm",
          type: "text",
          required: true,
          placeholder: "Vd: Phạt 200.000.000 đ và bồi thường 100% thiệt hại thực tế phát sinh",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Thỏa thuận bảo mật thông tin giữa DocDraft và đối tác công nghệ",
        input: {
          ben_a_ten: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM",
          ben_a_mst: "0109876543",
          ben_a_dai_dien: "Ông Nguyễn Văn An",
          ben_a_chuc_vu: "Tổng Giám đốc",
          ben_b_ten: "CÔNG TY TNHH GIẢI PHÁP PHẦN MỀM TECHPRO",
          ben_b_mst: "0312345678",
          ben_b_dai_dien: "Bà Trần Thị Mai",
          ben_b_chuc_vu: "Giám đốc điều hành",
          muc_dich_hop_tac: "Đánh giá khả thi tích hợp giải pháp DocDraft AI",
          pham_vi_thong_tin: "Mã nguồn, thuật toán AST OpenXML, tài liệu kiến trúc hệ thống",
          thoi_han_bao_mat: 3,
          che_tai_vi_pham: "Phạt 200.000.000 đ và bồi thường toàn bộ thiệt hại",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:100%; text-align:center; vertical-align:top; border:none;">
      <span style="font-size:12pt; font-weight:bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
      <span style="font-size:13pt; font-weight:bold; text-decoration:underline;">Độc lập - Tự do - Hạnh phúc</span><br/>
      <span style="font-size:12pt; font-style:italic;">Hà Nội, ngày 05 tháng 9 năm 2026</span>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-size:15pt; font-weight:bold; margin-top:15px; margin-bottom:5px;">THỎA THUẬN BẢO MẬT THÔNG TIN</h2>
<p style="text-align:center; font-style:italic; margin-top:0; margin-bottom:20px;">(Số: 01/2026/TTBM-DOCDRAFT-TECHPRO)</p>

<p><em>Căn cứ Bộ luật Dân sự ngày 24 tháng 11 năm 2015;</em></p>
<p><em>Căn cứ Luật Thương mại ngày 14 tháng 6 năm 2005;</em></p>
<p><em>Căn cứ nhu cầu và sự tự nguyện thỏa thuận của hai Bên,</em></p>

<p>Hôm nay, ngày 05 tháng 9 năm 2026, tại trụ sở Công ty Cổ phần Công nghệ DocDraft Việt Nam, chúng tôi gồm:</p>

<p><strong>BÊN TIẾT LỘ THÔNG TIN (BÊN A): CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM</strong><br/>
- Mã số doanh nghiệp: 0109876543<br/>
- Đại diện: <strong>Ông Nguyễn Văn An</strong> - Chức vụ: Tổng Giám đốc</p>

<p><strong>BÊN TIẾP NHẬN THÔNG TIN (BÊN B): CÔNG TY TNHH GIẢI PHÁP PHẦN MỀM TECHPRO</strong><br/>
- Mã số doanh nghiệp: 0312345678<br/>
- Đại diện: <strong>Bà Trần Thị Mai</strong> - Chức vụ: Giám đốc điều hành</p>

<p>Hai Bên đồng ý ký kết Thỏa thuận bảo mật thông tin (sau đây gọi tắt là &quot;Thỏa thuận&quot;) với các điều khoản sau:</p>

<p><strong>Điều 1. Phạm vi Thông tin bảo mật</strong><br/>
Thông tin bảo mật bao gồm: Mã nguồn, thuật toán AST OpenXML, tài liệu kiến trúc hệ thống và mọi dữ liệu kinh doanh mà Bên A cung cấp cho Bên B nhằm mục đích: Đánh giá khả thi tích hợp giải pháp DocDraft AI.</p>

<p><strong>Điều 2. Nghĩa vụ của Bên tiếp nhận</strong><br/>
1. Bên B cam kết giữ bí mật tuyệt đối các Thông tin bảo mật và chỉ sử dụng cho Mục đích hợp tác nêu tại Điều 1.<br/>
2. Không sao chép, phân phối hoặc cung cấp cho bất kỳ bên thứ ba nào khi chưa có văn bản đồng ý của Bên A.</p>

<p><strong>Điều 3. Thời hạn và Chế tài vi phạm</strong><br/>
1. Thỏa thuận này có hiệu lực trong vòng <strong>3 năm</strong> kể từ ngày ký.<br/>
2. Trường hợp Bên B vi phạm nghĩa vụ bảo mật, Bên B phải chịu mức phạt vi phạm là <strong>200.000.000 đ</strong> và có trách nhiệm bồi thường toàn bộ thiệt hại thực tế phát sinh cho Bên A.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN A</strong><br/>
      <em>(Ký, ghi rõ họ tên và đóng dấu)</em><br/><br/><br/><br/>
      <strong>Nguyễn Văn An</strong>
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN B</strong><br/>
      <em>(Ký, ghi rõ họ tên và đóng dấu)</em><br/><br/><br/><br/>
      <strong>Trần Thị Mai</strong>
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

  // 12. HỢP ĐỒNG CUNG CẤP DỊCH VỤ (SERVICE AGREEMENT) - SME PACK (TASK-212)
  {
    id: "hop-dong-dich-vu-sme",
    categoryId: "enterprise",
    industryPack: "SME",
    title: "Hợp đồng cung cấp dịch vụ công nghệ & tư vấn",
    description: "Hợp đồng kinh tế cung cấp giải pháp phần mềm, tư vấn chuyển đổi số giữa các doanh nghiệp vừa và nhỏ (SME) chuẩn Luật Thương mại.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Hợp đồng dịch vụ với các thông tin sau:
- Tên dịch vụ: {{ten_dich_vu}}
- Bên A (Bên thuê): {{ben_a_ten}} (Đại diện: {{ben_a_dai_dien}}, Chức vụ: {{ben_a_chuc_vu}})
- Bên B (Bên cung cấp): {{ben_b_ten}} (Đại diện: {{ben_b_dai_dien}}, Chức vụ: {{ben_b_chuc_vu}})
- Giá trị hợp đồng: {{gia_tri_hop_dong}}
- Phương thức thanh toán: {{phuong_thuc_thanh_toan}}
- Thời gian bàn giao: {{thoi_gian_ban_giao}}`,
    formSchema: {
      fields: [
        {
          name: "ten_dich_vu",
          label: "Tên gói dịch vụ / Hạng mục triển khai",
          type: "text",
          required: true,
          placeholder: "Vd: Triển khai phần mềm soạn thảo văn bản hành chính DocDraft AI Enterprise",
        },
        {
          name: "ben_a_ten",
          label: "Bên sử dụng dịch vụ (Bên A)",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY CỔ PHẦN BẤT ĐỘNG SẢN AN GIA",
        },
        {
          name: "ben_a_dai_dien",
          label: "Đại diện Bên A",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Lê Hoàng Quân",
        },
        {
          name: "ben_a_chuc_vu",
          label: "Chức vụ đại diện Bên A",
          type: "text",
          required: true,
          placeholder: "Vd: Phó Tổng Giám đốc",
        },
        {
          name: "ben_b_ten",
          label: "Bên cung ứng dịch vụ (Bên B)",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM",
        },
        {
          name: "ben_b_dai_dien",
          label: "Đại diện Bên B",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Nguyễn Văn An",
        },
        {
          name: "ben_b_chuc_vu",
          label: "Chức vụ đại diện Bên B",
          type: "text",
          required: true,
          placeholder: "Vd: Tổng Giám đốc",
        },
        {
          name: "gia_tri_hop_dong",
          label: "Tổng giá trị hợp đồng (VNĐ)",
          type: "text",
          required: true,
          placeholder: "Vd: 350.000.000 đ (Ba trăm năm mươi triệu đồng chẵn)",
        },
        {
          name: "phuong_thuc_thanh_toan",
          label: "Tiến độ thanh toán",
          type: "text",
          required: true,
          placeholder: "Vd: Tạm ứng 40% sau khi ký, thanh toán 60% còn lại sau nghiệm thu bàn giao",
        },
        {
          name: "thoi_gian_ban_giao",
          label: "Thời hạn hoàn thành bàn giao",
          type: "text",
          required: true,
          placeholder: "Vd: 45 ngày làm việc kể từ ngày tạm ứng",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Hợp đồng cung cấp dịch vụ phần mềm DocDraft AI",
        input: {
          ten_dich_vu: "Triển khai phần mềm soạn thảo văn bản hành chính DocDraft AI",
          ben_a_ten: "CÔNG TY CỔ PHẦN BẤT ĐỘNG SẢN AN GIA",
          ben_a_dai_dien: "Ông Lê Hoàng Quân",
          ben_a_chuc_vu: "Phó Tổng Giám đốc",
          ben_b_ten: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM",
          ben_b_dai_dien: "Ông Nguyễn Văn An",
          ben_b_chuc_vu: "Tổng Giám đốc",
          gia_tri_hop_dong: "350.000.000 đ (Ba trăm năm mươi triệu đồng chẵn)",
          phuong_thuc_thanh_toan: "Đợt 1: 40% sau khi ký; Đợt 2: 60% sau khi ký biên bản nghiệm thu",
          thoi_gian_ban_giao: "45 ngày làm việc",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:100%; text-align:center; vertical-align:top; border:none;">
      <span style="font-size:12pt; font-weight:bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
      <span style="font-size:13pt; font-weight:bold; text-decoration:underline;">Độc lập - Tự do - Hạnh phúc</span><br/>
      <span style="font-size:12pt; font-style:italic;">Hà Nội, ngày 05 tháng 9 năm 2026</span>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-size:15pt; font-weight:bold; margin-top:15px; margin-bottom:5px;">HỢP ĐỒNG DỊCH VỤ CÔNG NGHỆ</h2>
<p style="text-align:center; font-style:italic; margin-top:0; margin-bottom:20px;">(Số: 26/2026/HĐDV/ANGIA-DOCDRAFT)</p>

<p><em>Căn cứ Bộ luật Dân sự ngày 24 tháng 11 năm 2015;</em></p>
<p><em>Căn cứ Luật Thương mại ngày 14 tháng 6 năm 2005;</em></p>
<p><em>Căn cứ thỏa thuận thương mại giữa hai Bên,</em></p>

<p><strong>BÊN A (BÊN THUÊ DỊCH VỤ): CÔNG TY CỔ PHẦN BẤT ĐỘNG SẢN AN GIA</strong><br/>
- Đại diện: <strong>Ông Lê Hoàng Quân</strong> - Chức vụ: Phó Tổng Giám đốc</p>

<p><strong>BÊN B (BÊN CUNG CẤP DỊCH VỤ): CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM</strong><br/>
- Đại diện: <strong>Ông Nguyễn Văn An</strong> - Chức vụ: Tổng Giám đốc</p>

<p><strong>Điều 1. Nội dung dịch vụ</strong><br/>
Bên B nhận cung cấp và triển khai cho Bên A hạng mục: Triển khai phần mềm soạn thảo văn bản hành chính DocDraft AI theo đúng yêu cầu kỹ thuật đính kèm.</p>

<p><strong>Điều 2. Giá trị hợp đồng và Phương thức thanh toán</strong><br/>
1. Tổng giá trị hợp đồng là: <strong>350.000.000 đ (Ba trăm năm mươi triệu đồng chẵn)</strong> (đã bao gồm thuế GTGT).<br/>
2. Phương thức thanh toán: Chuyển khoản ngân hàng theo tiến độ:<br/>
- Đợt 1: Thanh toán 40% giá trị hợp đồng trong vòng 05 ngày làm việc sau khi ký kết.<br/>
- Đợt 2: Thanh toán 60% còn lại trong vòng 07 ngày làm việc sau khi hai Bên ký Biên bản nghiệm thu bàn giao hệ thống.</p>

<p><strong>Điều 3. Thời gian thực hiện</strong><br/>
Thời gian bàn giao hệ thống hoàn chỉnh là <strong>45 ngày làm việc</strong> kể từ ngày Bên B nhận được tiền tạm ứng đợt 1.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN A</strong><br/>
      <em>(Ký tên và đóng dấu)</em><br/><br/><br/><br/>
      <strong>Lê Hoàng Quân</strong>
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN B</strong><br/>
      <em>(Ký tên và đóng dấu)</em><br/><br/><br/><br/>
      <strong>Nguyễn Văn An</strong>
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

  // 13. BIÊN BẢN NGHIỆM THU VÀ BÀN GIAO (SME PACK) (TASK-212)
  {
    id: "bien-ban-nghiem-thu-sme",
    categoryId: "enterprise",
    industryPack: "SME",
    title: "Biên bản nghiệm thu và bàn giao dịch vụ",
    description: "Biên bản ghi nhận kết quả nghiệm thu hoàn thành công việc, bàn giao sản phẩm/dịch vụ làm căn cứ thanh toán và thanh lý hợp đồng.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Biên bản nghiệm thu và bàn giao dịch vụ:
- Số hợp đồng căn cứ: {{so_hop_dong}}
- Tên hạng mục nghiệm thu: {{hang_muc_nghiem_thu}}
- Đại diện Bên A (Khách hàng): {{ben_a_dai_dien}} (Chức vụ: {{ben_a_chuc_vu}})
- Đại diện Bên B (Đơn vị thực hiện): {{ben_b_dai_dien}} (Chức vụ: {{ben_b_chuc_vu}})
- Kết quả đánh giá: {{ket_qua_danh_gia}}
- Ý kiến kết luận: {{ket_luan}}`,
    formSchema: {
      fields: [
        {
          name: "so_hop_dong",
          label: "Số hiệu hợp đồng căn cứ",
          type: "text",
          required: true,
          placeholder: "Vd: Số 26/2026/HĐDV/ANGIA-DOCDRAFT ngày 05/09/2026",
        },
        {
          name: "hang_muc_nghiem_thu",
          label: "Hạng mục công việc bàn giao",
          type: "text",
          required: true,
          placeholder: "Vd: Triển khai và đào tạo người dùng phần mềm DocDraft AI",
        },
        {
          name: "ben_a_dai_dien",
          label: "Người phụ trách nghiệm thu Bên A",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Lê Hoàng Quân",
        },
        {
          name: "ben_a_chuc_vu",
          label: "Chức vụ Bên A",
          type: "text",
          required: true,
          placeholder: "Vd: Phó Tổng Giám đốc",
        },
        {
          name: "ben_b_dai_dien",
          label: "Người bàn giao Bên B",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Nguyễn Văn An",
        },
        {
          name: "ben_b_chuc_vu",
          label: "Chức vụ Bên B",
          type: "text",
          required: true,
          placeholder: "Vd: Tổng Giám đốc",
        },
        {
          name: "ket_qua_danh_gia",
          label: "Đánh giá chất lượng bàn giao",
          type: "textarea",
          required: true,
          placeholder: "Vd: Hệ thống vận hành ổn định 100%, đáp ứng đầy đủ yêu cầu tính năng theo phụ lục kỹ thuật.",
        },
        {
          name: "ket_luan",
          label: "Ý kiến kết luận hai bên",
          type: "text",
          required: true,
          placeholder: "Vd: Đồng ý nghiệm thu toàn bộ và tiến hành thủ tục thanh quyết toán",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Biên bản nghiệm thu phần mềm DocDraft AI",
        input: {
          so_hop_dong: "Số 26/2026/HĐDV/ANGIA-DOCDRAFT ngày 05/09/2026",
          hang_muc_nghiem_thu: "Triển khai phần mềm DocDraft AI Enterprise",
          ben_a_dai_dien: "Ông Lê Hoàng Quân",
          ben_a_chuc_vu: "Phó Tổng Giám đốc",
          ben_b_dai_dien: "Ông Nguyễn Văn An",
          ben_b_chuc_vu: "Tổng Giám đốc",
          ket_qua_danh_gia: "Hệ thống vận hành ổn định, bàn giao đầy đủ mã nguồn và tài liệu hướng dẫn vận hành.",
          ket_luan: "Đồng ý nghiệm thu đạt yêu cầu, làm cơ sở giải ngân đợt cuối.",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:100%; text-align:center; vertical-align:top; border:none;">
      <span style="font-size:12pt; font-weight:bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br/>
      <span style="font-size:13pt; font-weight:bold; text-decoration:underline;">Độc lập - Tự do - Hạnh phúc</span><br/>
      <span style="font-size:12pt; font-style:italic;">Hà Nội, ngày 20 tháng 10 năm 2026</span>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-size:15pt; font-weight:bold; margin-top:15px; margin-bottom:5px;">BIÊN BẢN NGHIỆM THU VÀ BÀN GIAO</h2>
<p style="text-align:center; font-style:italic; margin-top:0; margin-bottom:20px;">(Căn cứ Hợp đồng số: 26/2026/HĐDV/ANGIA-DOCDRAFT ngày 05/09/2026)</p>

<p>Hôm nay, ngày 20 tháng 10 năm 2026, các bên gồm có:</p>
<p><strong>BÊN A (BÊN NGHIỆM THU): CÔNG TY CỔ PHẦN BẤT ĐỘNG SẢN AN GIA</strong><br/>
- Đại diện: <strong>Ông Lê Hoàng Quân</strong> - Chức vụ: Phó Tổng Giám đốc</p>

<p><strong>BÊN B (BÊN BÀN GIAO): CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM</strong><br/>
- Đại diện: <strong>Ông Nguyễn Văn An</strong> - Chức vụ: Tổng Giám đốc</p>

<p>Hai bên cùng tiến hành nghiệm thu và bàn giao hạng mục: <strong>Triển khai phần mềm DocDraft AI Enterprise</strong> với nội dung chi tiết:</p>

<p><strong>1. Nội dung công việc hoàn thành:</strong><br/>
- Hoàn thành cài đặt máy chủ và cấu hình tích hợp LLM DeepSeek Gateway.<br/>
- Hoàn thành tổ chức 03 buổi đào tạo chuyên môn soạn thảo văn bản Nghị định 30.<br/>
- Bàn giao tài liệu hướng dẫn sử dụng và chứng chỉ bản quyền phần mềm.</p>

<p><strong>2. Đánh giá chất lượng:</strong><br/>
Hệ thống vận hành ổn định, bàn giao đầy đủ mã nguồn và tài liệu hướng dẫn vận hành.</p>

<p><strong>3. Kết luận:</strong><br/>
Đồng ý nghiệm thu đạt yêu cầu, làm cơ sở giải ngân đợt cuối theo quy định của Hợp đồng.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN A</strong><br/>
      <em>(Ký và ghi rõ họ tên)</em><br/><br/><br/><br/>
      <strong>Lê Hoàng Quân</strong>
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN B</strong><br/>
      <em>(Ký và ghi rõ họ tên)</em><br/><br/><br/><br/>
      <strong>Nguyễn Văn An</strong>
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

  // 14. THƯ BÁO GIÁ CHÍNH THỨC (QUOTATION) - SME PACK (TASK-212)
  {
    id: "thu-bao-gia-thuong-mai",
    categoryId: "enterprise",
    industryPack: "SME",
    title: "Thư báo giá thương mại chính thức",
    description: "Thư chào giá sản phẩm, giải pháp phần mềm và điều khoản thanh toán gửi khách hàng doanh nghiệp chuẩn mực chuyên nghiệp.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Thư báo giá chính thức:
- Đơn vị gửi báo giá: {{don_vi_gui}}
- Khách hàng nhận báo giá: {{khach_hang_nhan}}
- Tên gói sản phẩm/dịch vụ: {{ten_san_pham}}
- Đơn giá & Số lượng: {{don_gia_so_luong}}
- Tổng giá trị chào giá: {{tong_gia_tri}}
- Thời hạn hiệu lực báo giá: {{thoi_han_hieu_luc}}`,
    formSchema: {
      fields: [
        {
          name: "don_vi_gui",
          label: "Doanh nghiệp phát hành báo giá",
          type: "text",
          required: true,
          placeholder: "Vd: CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM",
        },
        {
          name: "khach_hang_nhan",
          label: "Tên cơ quan / Công ty nhận báo giá",
          type: "text",
          required: true,
          placeholder: "Vd: NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN PHÁT TRIỂN VIỆT",
        },
        {
          name: "ten_san_pham",
          label: "Tên giải pháp / Sản phẩm chào giá",
          type: "text",
          required: true,
          placeholder: "Vd: Bản quyền DocDraft AI Enterprise On-Premise (50 người dùng)",
        },
        {
          name: "don_gia_so_luong",
          label: "Chi tiết đơn giá và hạng mục",
          type: "textarea",
          required: true,
          placeholder: "Vd: 50 License Enterprise x 5.000.000 đ/năm = 250.000.000 đ. Phí triển khai: 50.000.000 đ.",
        },
        {
          name: "tong_gia_tri",
          label: "Tổng tiền chào giá (VNĐ)",
          type: "text",
          required: true,
          placeholder: "Vd: 300.000.000 đ (Chưa bao gồm thuế GTGT)",
        },
        {
          name: "thoi_han_hieu_luc",
          label: "Thời hạn hiệu lực của thư báo giá",
          type: "text",
          required: true,
          placeholder: "Vd: 30 ngày kể từ ngày phát hành",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Thư chào giá DocDraft AI Enterprise",
        input: {
          don_vi_gui: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM",
          khach_hang_nhan: "NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN PHÁT TRIỂN VIỆT",
          ten_san_pham: "Giải pháp DocDraft AI Enterprise On-Premise",
          don_gia_so_luong: "50 License x 5.000.000 đ = 250.000.000 đ; Phí hỗ trợ triển khai = 50.000.000 đ",
          tong_gia_tri: "300.000.000 đ (Chưa bao gồm VAT)",
          thoi_han_hieu_luc: "30 ngày kể từ ngày phát hành",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:50%; text-align:left; vertical-align:top; border:none;">
      <strong>CÔNG TY CỔ PHẦN CÔNG NGHỆ DOCDRAFT VIỆT NAM</strong><br/>
      <span>Tầng 8, Tòa nhà Văn phòng Tech Tower, Hà Nội</span><br/>
      <span>Hotline: 1900 6868 - Email: contact@docdraft.vn</span>
    </td>
    <td style="width:50%; text-align:right; vertical-align:top; border:none;">
      <span style="font-style:italic;">Hà Nội, ngày 05 tháng 9 năm 2026</span><br/>
      <span>Số: 88/2026/BG-DOCDRAFT</span>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-size:15pt; font-weight:bold; margin-top:20px; margin-bottom:10px;">THƯ BÁO GIÁ DỊCH VỤ</h2>

<p><strong>Kính gửi: BAN LÃNH ĐẠO NGÂN HÀNG THƯƠNG MẠI CỔ PHẦN PHÁT TRIỂN VIỆT</strong></p>

<p>Công ty Cổ phần Công nghệ DocDraft Việt Nam xin gửi lời chào trân trọng và lời chúc phát triển thịnh vượng đến Quý Ngân hàng. Căn cứ nhu cầu số hóa quy trình soạn thảo văn bản chuẩn thể thức, chúng tôi xin trân trọng gửi bảng báo giá như sau:</p>

<p><strong>1. Hạng mục chào giá:</strong> Giải pháp DocDraft AI Enterprise On-Premise</p>
<p><strong>2. Chi tiết đơn giá:</strong><br/>
- 50 License bản quyền hệ thống: 250.000.000 đ.<br/>
- Dịch vụ tích hợp LLM nội bộ và đào tạo: 50.000.000 đ.</p>

<p><strong>3. Tổng giá trị chào giá: 300.000.000 đ (Chưa bao gồm VAT)</strong></p>

<p><strong>4. Điều khoản thương mại:</strong><br/>
- Thời hạn hiệu lực báo giá: <strong>30 ngày kể từ ngày phát hành</strong>.<br/>
- Thời gian bảo hành và nâng cấp: 12 tháng liên tục 24/7.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:left; vertical-align:top; border:none;">
      <em>Nơi nhận:</em><br/>
      - Như trên;<br/>
      - Lưu: Ban Kinh doanh.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>GIÁM ĐỐC KINH DOANH</strong><br/>
      <em>(Ký và đóng dấu)</em><br/><br/><br/><br/>
      <strong>Phan Nhật Minh</strong>
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

  // ==========================================
  // 15. GÓI PMO: BIÊN BẢN NGHIỆM THU CÔNG VIỆC XÂY DỰNG
  // ==========================================
  {
    id: "pmo-acceptance-minutes",
    categoryId: "construction",
    industryPack: "PMO",
    title: "Biên bản nghiệm thu công việc xây dựng",
    description:
      "Biên bản nghiệm thu công việc xây dựng, giai đoạn thi công hoàn thành tuân thủ nghiêm ngặt Nghị định số 06/2021/NĐ-CP và hồ sơ thiết kế kỹ thuật thi công.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Biên bản nghiệm thu công việc xây dựng với thông tin sau:
- Tên công trình / Dự án: {{ten_du_an}}
- Hạng mục / Công việc nghiệm thu: {{hang_muc_nghiem_thu}}
- Địa điểm xây dựng: {{dia_diem_xay_dung}}
- Đại diện Chủ đầu tư / Ban QLDA: {{chu_dau_tu}}
- Đại diện Tư vấn Giám sát: {{tu_van_giam_sat}}
- Đại diện Nhà thầu thi công: {{nha_thau_thi_cong}}
- Thời gian nghiệm thu: {{thoi_gian_nghiem_thu}}
- Đánh giá chất lượng công việc: {{danh_gia_chat_luong}}
- Kết luận nghiệm thu: {{ket_luan_nghiem_thu}}`,
    formSchema: {
      fields: [
        {
          name: "ten_du_an",
          label: "Tên dự án / Công trình xây dựng",
          type: "text",
          required: true,
          placeholder: "Vd: Dự án Xây dựng Tòa nhà Văn phòng DocDraft Tower",
          validation: { min_length: 5, max_length: 250 },
        },
        {
          name: "hang_muc_nghiem_thu",
          label: "Hạng mục / Công việc nghiệm thu",
          type: "text",
          required: true,
          placeholder: "Vd: Nghiệm thu công tác cốt thép, cốp pha sàn tầng 5, trục 1-4/A-D",
          validation: { min_length: 5, max_length: 250 },
        },
        {
          name: "dia_diem_xay_dung",
          label: "Địa điểm xây dựng",
          type: "text",
          required: true,
          placeholder: "Vd: Lô E2, Khu Đô thị mới Cầu Giấy, Hà Nội",
        },
        {
          name: "chu_dau_tu",
          label: "Đại diện Chủ đầu tư / Ban QLDA",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Trần Văn Cương - Giám đốc Ban QLDA",
        },
        {
          name: "tu_van_giam_sat",
          label: "Đại diện Tư vấn Giám sát",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Nguyễn Hoàng Linh - Kỹ sư trưởng TVGS",
        },
        {
          name: "nha_thau_thi_cong",
          label: "Đại diện Nhà thầu thi công",
          type: "text",
          required: true,
          placeholder: "Vd: Ông Vũ Mạnh Hùng - Chỉ huy trưởng công trình",
        },
        {
          name: "thoi_gian_nghiem_thu",
          label: "Thời gian bắt đầu & kết thúc nghiệm thu",
          type: "text",
          required: true,
          placeholder: "Vd: Bắt đầu 09h00 ngày 05/09/2026, kết thúc 11h30 cùng ngày",
        },
        {
          name: "danh_gia_chat_luong",
          label: "Đánh giá chất lượng và sự phù hợp",
          type: "textarea",
          required: true,
          placeholder: "Vd: Đúng bản vẽ thiết kế thi công đã duyệt, đạt yêu cầu tiêu chuẩn kỹ thuật TCVN 4453:1995.",
        },
        {
          name: "ket_luan_nghiem_thu",
          label: "Kết luận nghiệm thu",
          type: "text",
          required: true,
          placeholder: "Vd: Đồng ý nghiệm thu công việc xây dựng; Cho phép chuyển bước thi công đổ bê tông sàn tầng 5.",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Biên bản nghiệm thu công tác đổ bê tông sàn",
        input: {
          ten_du_an: "Dự án Tòa nhà phức hợp DocDraft Tower",
          hang_muc_nghiem_thu: "Nghiệm thu công tác đổ bê tông sàn tầng hầm B1",
          dia_diem_xay_dung: "Số 18 Phạm Hùng, Nam Từ Liêm, Hà Nội",
          chu_dau_tu: "Ban Quản lý Dự án Tòa nhà DocDraft",
          tu_van_giam_sat: "Công ty Cổ phần Tư vấn Xây dựng Hà Nội",
          nha_thau_thi_cong: "Công ty TNHH Đầu tư & Xây dựng Phúc Thịnh",
          thoi_gian_nghiem_thu: "09h00 ngày 05 tháng 09 năm 2026",
          danh_gia_chat_luong: "Kích thước hình học, cốt thép, cốp pha đúng hồ sơ bản vẽ thiết kế thi công đã duyệt; Đạt yêu cầu tiêu chuẩn kỹ thuật.",
          ket_luan_nghiem_thu: "Chấp thuận nghiệm thu và đồng ý cho phép triển khai bước thi công tiếp theo.",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-size:12pt;">BAN QUẢN LÝ DỰ ÁN TÒA NHÀ DOCDRAFT</p>
      <p style="margin:0; font-weight:bold; font-size:12pt;">BỘ PHẬN KỸ THUẬT - QA/QC</p>
      <p style="margin:2px auto; width:120px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-size:12pt;">Số: 26/BB-NT/B1</p>
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-weight:bold; font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p style="margin:0; font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</p>
      <p style="margin:2px auto; width:160px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-style:italic; font-size:12pt;">Hà Nội, ngày 05 tháng 09 năm 2026</p>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-weight:bold; font-size:15pt; margin:20px 0 5px 0;">BIÊN BẢN NGHIỆM THU CÔNG VIỆC XÂY DỰNG</h2>
<p style="text-align:center; font-style:italic; margin-bottom:20px;">(Căn cứ Nghị định số 06/2021/NĐ-CP ngày 26/01/2021 của Chính phủ)</p>

<p><strong>1. Đối tượng và địa điểm nghiệm thu:</strong><br/>
- Tên công việc: Nghiệm thu công tác đổ bê tông sàn tầng hầm B1.<br/>
- Tên dự án: Dự án Tòa nhà phức hợp DocDraft Tower.<br/>
- Địa điểm xây dựng: Số 18 Phạm Hùng, Nam Từ Liêm, Hà Nội.<br/>
- Thời gian tiến hành: Vào hồi 09 giờ 00 phút ngày 05 tháng 09 năm 2026.</p>

<p><strong>2. Thành phần trực tiếp nghiệm thu:</strong><br/>
- Đại diện Chủ đầu tư: Ông [HỌ TÊN ĐẠI DIỆN CĐT], Chức vụ: Giám đốc Dự án.<br/>
- Đại diện Tư vấn giám sát: Ông [HỌ TÊN KỸ SƯ TRƯỞNG TVGS], Chức vụ: Kỹ sư trưởng.<br/>
- Đại diện Nhà thầu thi công: Ông [HỌ TÊN CHỈ HUY TRƯỞNG], Chức vụ: Chỉ huy trưởng.</p>

<p><strong>3. Căn cứ nghiệm thu:</strong><br/>
- Căn cứ Hợp đồng thi công xây dựng số [SỐ HỢP ĐỒNG] đã ký kết;<br/>
- Căn cứ Hồ sơ thiết kế bản vẽ thi công và các chỉ dẫn kỹ thuật được phê duyệt;<br/>
- Căn cứ Tiêu chuẩn kỹ thuật thi công và nghiệm thu bê tông cốt thép hiện hành (TCVN 4453:1995);<br/>
- Căn cứ Phiếu kiểm tra kết quả thí nghiệm vật liệu đầu vào và nhật ký thi công công trình.</p>

<p><strong>4. Đánh giá chất lượng công việc xây dựng:</strong><br/>
- Về kích thước hình học, độ cao độ và độ phẳng: Phù hợp bản vẽ thiết kế kỹ thuật;<br/>
- Về vật liệu và quy trình đổ bê tông: Đạt yêu cầu chất lượng kỹ thuật theo quy định;<br/>
- Các ý kiến khác: Đảm bảo vệ sinh môi trường và an toàn lao động tại công trường.</p>

<p><strong>5. Kết luận:</strong><br/>
- Chấp nhận nghiệm thu công việc: Nghiệm thu công tác đổ bê tông sàn tầng hầm B1.<br/>
- Đồng ý cho phép nhà thầu tiếp tục triển khai thi công bước tiếp theo: Lắp dựng cốp pha cột vách tầng hầm B1.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:33%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN NHÀ THẦU</strong><br/>
      <em>(Ký, ghi rõ họ tên)</em><br/><br/><br/><br/>
      <strong>Vũ Mạnh Hùng</strong>
    </td>
    <td style="width:33%; text-align:center; vertical-align:top; border:none;">
      <strong>TƯ VẤN GIÁM SÁT</strong><br/>
      <em>(Ký, ghi rõ họ tên)</em><br/><br/><br/><br/>
      <strong>Nguyễn Hoàng Linh</strong>
    </td>
    <td style="width:34%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN CHỦ ĐẦU TƯ</strong><br/>
      <em>(Ký, ghi rõ họ tên)</em><br/><br/><br/><br/>
      <strong>Trần Văn Cương</strong>
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

  // ==========================================
  // 16. GÓI PMO: TỜ TRÌNH THANH TOÁN KHỐI LƯỢNG HOÀN THÀNH
  // ==========================================
  {
    id: "pmo-payment-proposal",
    categoryId: "construction",
    industryPack: "PMO",
    title: "Tờ trình xin thanh toán khối lượng hoàn thành",
    description:
      "Tờ trình của Nhà thầu / Ban điều hành dự án đề nghị Chủ đầu tư thanh toán khối lượng thi công hoàn thành theo từng đợt của hợp đồng xây dựng.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Tờ trình xin thanh toán khối lượng thi công hoàn thành với thông tin sau:
- Tên công trình / Dự án: {{ten_du_an}}
- Số hợp đồng thi công: {{so_hop_dong}}
- Tên Nhà thầu thi công: {{nha_thau}}
- Tên Chủ đầu tư / Ban QLDA: {{chu_dau_tu}}
- Đợt thanh toán: {{dot_thanh_toan}}
- Tổng giá trị hợp đồng: {{gia_tri_hop_dong}}
- Giá trị khối lượng hoàn thành đợt này: {{gia_tri_nghiem_thu_dot_nay}}
- Khấu trừ tạm ứng / bảo hành đợt này: {{khau_tru_tam_ung}}
- Số tiền đề nghị thanh toán: {{so_tien_de_nghi_thanh_toan}}
- Thông tin tài khoản thụ hưởng: {{tai_khoan_thu_huong}}`,
    formSchema: {
      fields: [
        {
          name: "ten_du_an",
          label: "Tên dự án / Gói thầu xây lắp",
          type: "text",
          required: true,
          placeholder: "Vd: Dự án Xây dựng Cầu đường vành đai 3 trên cao",
        },
        {
          name: "so_hop_dong",
          label: "Số và ngày ký Hợp đồng",
          type: "text",
          required: true,
          placeholder: "Vd: Hợp đồng số 12/2025/HĐ-XD ngày 15/03/2025",
        },
        {
          name: "nha_thau",
          label: "Tên Nhà thầu thi công",
          type: "text",
          required: true,
          placeholder: "Vd: Tổng công ty Đầu tư & Phát triển Hạ tầng Giao thông",
        },
        {
          name: "chu_dau_tu",
          label: "Tên Chủ đầu tư / Ban QLDA",
          type: "text",
          required: true,
          placeholder: "Vd: Ban Quản lý Dự án Đầu tư Xây dựng Công trình Giao thông TP. Hà Nội",
        },
        {
          name: "dot_thanh_toan",
          label: "Đợt thanh toán",
          type: "text",
          required: true,
          placeholder: "Vd: Đợt 03 (Tháng 08/2026)",
        },
        {
          name: "gia_tri_hop_dong",
          label: "Tổng giá trị hợp đồng đã ký",
          type: "text",
          required: true,
          placeholder: "Vd: 120.000.000.000 đ (Một trăm hai mươi tỷ đồng)",
        },
        {
          name: "gia_tri_nghiem_thu_dot_nay",
          label: "Giá trị khối lượng nghiệm thu đợt này",
          type: "text",
          required: true,
          placeholder: "Vd: 18.500.000.000 đ (Mười tám tỷ năm trăm triệu đồng)",
        },
        {
          name: "khau_tru_tam_ung",
          label: "Khấu trừ tạm ứng & giữ lại bảo hành",
          type: "text",
          required: true,
          placeholder: "Vd: 3.700.000.000 đ (20% tạm ứng) và 925.000.000 đ (5% bảo hành)",
        },
        {
          name: "so_tien_de_nghi_thanh_toan",
          label: "Số tiền thực tế đề nghị thanh toán",
          type: "text",
          required: true,
          placeholder: "Vd: 13.875.000.000 đ (Mười ba tỷ tám trăm bảy mươi lăm triệu đồng)",
        },
        {
          name: "tai_khoan_thu_huong",
          label: "Số tài khoản và ngân hàng thụ hưởng",
          type: "text",
          required: true,
          placeholder: "Vd: TK 0123456789 tại Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV) - Chi nhánh Hà Nội",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Tờ trình đề nghị thanh toán khối lượng xây dựng đợt 3",
        input: {
          ten_du_an: "Gói thầu số 05 - Xây lắp cầu vượt và đường dẫn",
          so_hop_dong: "Hợp đồng số 45/2025/HĐ-XD ngày 10/01/2025",
          nha_thau: "Công ty Cổ phần Xây dựng Giao thông 1",
          chu_dau_tu: "Ban Quản lý Dự án Giao thông Đô thị",
          dot_thanh_toan: "Đợt 03",
          gia_tri_hop_dong: "85.000.000.000 đ",
          gia_tri_nghiem_thu_dot_nay: "12.000.000.000 đ",
          khau_tru_tam_ung: "2.400.000.000 đ",
          so_tien_de_nghi_thanh_toan: "9.600.000.000 đ",
          tai_khoan_thu_huong: "Số TK 1122334455 tại Vietcombank - Chi nhánh Thăng Long",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-size:12pt;">CÔNG TY CP XÂY DỰNG GIAO THÔNG 1</p>
      <p style="margin:0; font-weight:bold; font-size:12pt;">BAN ĐIỀU HÀNH DỰ ÁN</p>
      <p style="margin:2px auto; width:120px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-size:12pt;">Số: 108/TTr-BĐH</p>
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-weight:bold; font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p style="margin:0; font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</p>
      <p style="margin:2px auto; width:160px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-style:italic; font-size:12pt;">Hà Nội, ngày 05 tháng 09 năm 2026</p>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-weight:bold; font-size:15pt; margin:20px 0 5px 0;">TỜ TRÌNH</h2>
<p style="text-align:center; font-style:italic; margin-bottom:20px;">V/v Đề nghị thanh toán khối lượng hoàn thành Đợt 03 - Gói thầu số 05</p>

<p style="margin-left:40px;"><strong>Kính gửi:</strong> Ban Quản lý Dự án Giao thông Đô thị.</p>

<p><em>- Căn cứ Hợp đồng số 45/2025/HĐ-XD ngày 10/01/2025 ký giữa Ban Quản lý Dự án Giao thông Đô thị và Công ty Cổ phần Xây dựng Giao thông 1;</em></p>
<p><em>- Căn cứ Biên bản nghiệm thu công việc xây dựng và Bảng xác định giá trị khối lượng công việc hoàn thành Đợt 03 đã được Tư vấn giám sát xác nhận;</em></p>
<p><em>- Căn cứ tình hình thi công thực tế tại công trường.</em></p>

<p>Nhà thầu kính trình Ban Quản lý Dự án xem xét và giải quyết thanh toán khối lượng thi công xây dựng hoàn thành Đợt 03 với các nội dung chi tiết sau:</p>

<p><strong>1. Thông tin hợp đồng:</strong><br/>
- Tên công trình: Gói thầu số 05 - Xây lắp cầu vượt và đường dẫn.<br/>
- Tổng giá trị hợp đồng: <strong>85.000.000.000 đ</strong> (Tám mươi lăm tỷ đồng).</p>

<p><strong>2. Giá trị đề nghị thanh toán Đợt 03:</strong><br/>
- Giá trị khối lượng nghiệm thu hoàn thành: <strong>12.000.000.000 đ</strong>.<br/>
- Khấu trừ hoàn trả tiền tạm ứng: <strong>2.400.000.000 đ</strong>.<br/>
- Số tiền đề nghị thanh toán thực tế đợt này: <strong>9.600.000.000 đ</strong> (Bằng chữ: Chín tỷ sáu trăm triệu đồng chẵn).</p>

<p><strong>3. Thông tin tài khoản thụ hưởng:</strong><br/>
- Đơn vị thụ hưởng: Công ty Cổ phần Xây dựng Giao thông 1.<br/>
- Số tài khoản: <strong>1122334455</strong> tại Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) - Chi nhánh Thăng Long.</p>

<p>Kính đề nghị Ban Quản lý Dự án Giao thông Đô thị xem xét, hoàn tất thủ tục chuyển tiền để Nhà thầu tiếp tục đẩy nhanh tiến độ thi công công trình.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:left; vertical-align:top; border:none;">
      <em>Nơi nhận:</em><br/>
      - Như trên;<br/>
      - TVGS (để phối hợp);<br/>
      - Lưu: VT, BĐH.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>GIÁM ĐỐC BAN ĐIỀU HÀNH DỰ ÁN</strong><br/>
      <em>(Ký và đóng dấu)</em><br/><br/><br/><br/>
      <strong>Đỗ Quốc Tuấn</strong>
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

  // ==========================================
  // 17. GÓI PMO: HỢP ĐỒNG THẦU PHỤ THI CÔNG XÂY DỰNG
  // ==========================================
  {
    id: "pmo-subcontractor-agreement",
    categoryId: "construction",
    industryPack: "PMO",
    title: "Hợp đồng thầu phụ thi công xây dựng",
    description:
      "Hợp đồng giao kết giữa Tổng thầu / Nhà thầu chính và Thầu phụ thi công phần việc chuyên môn hoặc nhân công xây lắp theo Luật Xây dựng.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Hợp đồng thầu phụ thi công xây dựng với thông tin sau:
- Bên giao thầu (Tổng thầu): {{ben_giao_thau}}
- Bên nhận thầu (Thầu phụ): {{ben_nhan_thau}}
- Tên công trình và vị trí: {{ten_cong_trinh}}
- Phạm vi nội dung công việc: {{noi_dung_cong_viec}}
- Giá trị hợp đồng: {{gia_tri_hop_dong}}
- Tiến độ thi công: {{tien_do_thi_cong}}
- Phương thức thanh toán: {{phuong_thuc_thanh_toan}}
- Yêu cầu về An toàn lao động & Vệ sinh môi trường: {{an_toan_lao_dong}}`,
    formSchema: {
      fields: [
        {
          name: "ben_giao_thau",
          label: "Bên giao thầu (Tổng thầu / Nhà thầu chính)",
          type: "text",
          required: true,
          placeholder: "Vd: Công ty Cổ phần Tập đoàn Xây dựng Thăng Long, Đại diện: Ông Lê Văn Hưng - Tổng Giám đốc",
        },
        {
          name: "ben_nhan_thau",
          label: "Bên nhận thầu (Thầu phụ thi công)",
          type: "text",
          required: true,
          placeholder: "Vd: Công ty TNHH Cơ điện & PCCC Sao Mai, Đại diện: Ông Nguyễn Văn Bình - Giám đốc",
        },
        {
          name: "ten_cong_trinh",
          label: "Tên công trình và vị trí thi công",
          type: "text",
          required: true,
          placeholder: "Vd: Tòa nhà Trụ sở Văn phòng Tập đoàn, Khu đô thị Tây Hồ Tây, Hà Nội",
        },
        {
          name: "noi_dung_cong_viec",
          label: "Phạm vi nội dung công việc giao thầu",
          type: "textarea",
          required: true,
          placeholder: "Vd: Thi công cung cấp vật tư và lắp đặt toàn bộ hệ thống Phòng cháy chữa cháy (PCCC) từ tầng hầm đến tầng mái.",
        },
        {
          name: "gia_tri_hop_dong",
          label: "Giá trị hợp đồng thầu phụ",
          type: "text",
          required: true,
          placeholder: "Vd: 15.600.000.000 đ (Mười lăm tỷ sáu trăm triệu đồng, đã bao gồm thuế VAT)",
        },
        {
          name: "tien_do_thi_cong",
          label: "Thời gian khởi công & hoàn thành",
          type: "text",
          required: true,
          placeholder: "Vd: Khởi công ngày 15/09/2026, nghiệm thu bàn giao trước ngày 30/03/2027 (Tổng thời gian 195 ngày)",
        },
        {
          name: "phuong_thuc_thanh_toan",
          label: "Điều khoản tạm ứng & thanh toán",
          type: "text",
          required: true,
          placeholder: "Vd: Tạm ứng 20% sau khi ký hợp đồng và có bảo lãnh; Thanh toán theo khối lượng nghiệm thu hàng tháng 75%; Giữ lại bảo hành 5%.",
        },
        {
          name: "an_toan_lao_dong",
          label: "Trách nhiệm An toàn lao động (ATLĐ)",
          type: "text",
          required: true,
          placeholder: "Vd: Thầu phụ chịu trách nhiệm 100% về trang bị bảo hộ lao động, tập huấn an toàn và bồi thường thiệt hại nếu xảy ra sự cố.",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Hợp đồng thầu phụ thi công hệ thống PCCC tòa nhà",
        input: {
          ben_giao_thau: "Công ty Cổ phần Xây dựng Thăng Long (Bên A)",
          ben_nhan_thau: "Công ty TNHH Cơ điện Sao Mai (Bên B)",
          ten_cong_trinh: "Tòa nhà Trụ sở DocDraft Complex, Hà Nội",
          noi_dung_cong_viec: "Cung cấp vật tư thiết bị và thi công lắp đặt hoàn chỉnh hệ thống báo cháy tự động, chữa cháy vách tường và sprinkler.",
          gia_tri_hop_dong: "12.500.000.000 đ",
          tien_do_thi_cong: "Bắt đầu ngày 01/10/2026, hoàn thành ngày 15/04/2027",
          phuong_thuc_thanh_toan: "Tạm ứng 20%, thanh toán theo nghiệm thu từng tầng 75%, bảo hành 5% trong 24 tháng.",
          an_toan_lao_dong: "Tuân thủ nghiêm quy định an toàn lao động, vệ sinh môi trường và PCCC tại công trường.",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:100%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-weight:bold; font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p style="margin:0; font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</p>
      <p style="margin:2px auto; width:160px; border-bottom:1px solid #000;"></p>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-weight:bold; font-size:16pt; margin:15px 0 5px 0;">HỢP ĐỒNG THẦU PHỤ THI CÔNG XÂY DỰNG</h2>
<p style="text-align:center; font-size:12pt; margin-bottom:20px;">Số: 89/2026/HĐTP-TL-SM</p>

<p><em>- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;</em></p>
<p><em>- Căn cứ Luật Xây dựng số 50/2014/QH13 và Luật sửa đổi bổ sung năm 2020;</em></p>
<p><em>- Căn cứ Nghị định số 37/2015/NĐ-CP và Nghị định số 50/2021/NĐ-CP của Chính phủ về hợp đồng xây dựng;</em></p>
<p><em>- Căn cứ nhu cầu và khả năng thực tế của hai bên.</em></p>

<p>Hôm nay, ngày 05 tháng 09 năm 2026, tại Trụ sở Bên A, chúng tôi gồm có:</p>

<p><strong>BÊN GIAO THẦU (BÊN A): CÔNG TY CỔ PHẦN XÂY DỰNG THĂNG LONG</strong><br/>
- Đại diện: Ông <strong>Lê Văn Hưng</strong> - Chức vụ: Tổng Giám đốc.<br/>
- Địa chỉ: Tầng 12, Tòa nhà Licogi 13, Thanh Xuân, Hà Nội.<br/>
- Mã số thuế: 0101234567.</p>

<p><strong>BÊN NHẬN THẦU (BÊN B): CÔNG TY TNHH CƠ ĐIỆN SAO MAI</strong><br/>
- Đại diện: Ông <strong>Nguyễn Văn Bình</strong> - Chức vụ: Giám đốc.<br/>
- Địa chỉ: Số 56 đường Hoàng Quốc Việt, Cầu Giấy, Hà Nội.<br/>
- Mã số thuế: 0107654321.</p>

<p>Hai bên thống nhất ký kết Hợp đồng thầu phụ với các điều khoản cụ thể sau:</p>

<p><strong>Điều 1. Phạm vi công việc:</strong><br/>
Bên A giao và Bên B nhận thi công cung cấp vật tư thiết bị và lắp đặt hoàn chỉnh hệ thống báo cháy tự động, chữa cháy vách tường và hệ thống chữa cháy tự động Sprinkler thuộc dự án Tòa nhà Trụ sở DocDraft Complex.</p>

<p><strong>Điều 2. Giá trị hợp đồng và hình thức giá:</strong><br/>
1. Tổng giá trị hợp đồng: <strong>12.500.000.000 đ</strong> (Mười hai tỷ năm trăm triệu đồng chẵn). Đã bao gồm thuế GTGT 10%.<br/>
2. Hình thức giá hợp đồng: Hợp đồng theo đơn giá cố định.</p>

<p><strong>Điều 3. Tiến độ thực hiện:</strong><br/>
- Ngày khởi công: Ngày 01 tháng 10 năm 2026.<br/>
- Ngày hoàn thành nghiệm thu bàn giao: Ngày 15 tháng 04 năm 2027.</p>

<p><strong>Điều 4. Tạm ứng và thanh toán:</strong><br/>
- Tạm ứng: 20% giá trị hợp đồng sau khi ký kết và nộp bảo lãnh tạm ứng.<br/>
- Thanh toán định kỳ: Thanh toán 75% giá trị khối lượng hoàn thành được nghiệm thu hàng tháng.<br/>
- Giữ lại bảo hành: 5% giá trị hợp đồng trong thời hạn bảo hành 24 tháng.</p>

<p><strong>Điều 5. An toàn lao động và Bảo hiểm:</strong><br/>
Bên B có nghĩa vụ trang bị đầy đủ bảo hộ lao động, thực hiện nghiêm ngặt biện pháp ATLĐ, PCCC và chịu hoàn toàn trách nhiệm pháp lý nếu để xảy ra tai nạn lao động tại khu vực thi công của mình.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN B</strong><br/>
      <em>(Ký tên, đóng dấu)</em><br/><br/><br/><br/>
      <strong>Nguyễn Văn Bình</strong>
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>ĐẠI DIỆN BÊN A</strong><br/>
      <em>(Ký tên, đóng dấu)</em><br/><br/><br/><br/>
      <strong>Lê Văn Hưng</strong>
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

  // ==========================================
  // 18. GÓI PMO: BÁO CÁO ĐỊNH KỲ TIẾN ĐỘ THI CÔNG VÀ AN TOÀN LAO ĐỘNG
  // ==========================================
  {
    id: "pmo-progress-report",
    categoryId: "construction",
    industryPack: "PMO",
    title: "Báo cáo định kỳ tiến độ thi công và an toàn lao động",
    description:
      "Báo cáo tuần / tháng của Ban Chỉ huy công trường gửi Chủ đầu tư và Tư vấn Quản lý dự án về tiến độ thực hiện, chất lượng và an toàn vệ sinh lao động.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Báo cáo định kỳ tiến độ thi công và an toàn lao động với thông tin sau:
- Tên công trình / Dự án: {{ten_du_an}}
- Ban chỉ huy công trường / Nhà thầu: {{ban_chi_huy}}
- Kỳ báo cáo: {{ky_bao_cao}}
- Khối lượng công việc chính đã hoàn thành: {{khoi_luong_hoan_thanh}}
- Đánh giá tiến độ so với kế hoạch: {{danh_gia_tien_do}}
- Tình hình an toàn lao động & vệ sinh môi trường: {{cong_tac_an_toan}}
- Kế hoạch công tác kỳ tiếp theo: {{ke_hoach_ky_toi}}
- Đề xuất và kiến nghị với Chủ đầu tư: {{kien_nghi_chu_dau_tu}}`,
    formSchema: {
      fields: [
        {
          name: "ten_du_an",
          label: "Tên dự án / Công trình",
          type: "text",
          required: true,
          placeholder: "Vd: Dự án Cụm Chung cư Cao tầng Thăng Long Plaza",
        },
        {
          name: "ban_chi_huy",
          label: "Ban chỉ huy công trường / Nhà thầu",
          type: "text",
          required: true,
          placeholder: "Vd: Ban Chỉ huy Công trường - Công ty Cổ phần Xây dựng Delta",
        },
        {
          name: "ky_bao_cao",
          label: "Kỳ báo cáo",
          type: "text",
          required: true,
          placeholder: "Vd: Báo cáo Tuần 35 (Từ 25/08 đến 31/08/2026) / Tháng 08/2026",
        },
        {
          name: "khoi_luong_hoan_thanh",
          label: "Khối lượng công việc đã hoàn thành trong kỳ",
          type: "textarea",
          required: true,
          placeholder: "Vd: Hoàn thành đổ bê tông cột vách tầng 12, lắp dựng cốp pha sàn tầng 13 đạt 80%, thi công xây tường ngăn tầng 8 đạt 95%.",
        },
        {
          name: "danh_gia_tien_do",
          label: "Đánh giá tiến độ so với kế hoạch mốc",
          type: "text",
          required: true,
          placeholder: "Vd: Đảm bảo đúng tiến độ tổng thể; Dự kiến cất nóc đúng cam kết ngày 15/11/2026.",
        },
        {
          name: "cong_tac_an_toan",
          label: "Tình hình An toàn lao động, PCCC & Vệ sinh",
          type: "textarea",
          required: true,
          placeholder: "Vd: Trong kỳ không có sự cố mất ATLĐ; Lưới bao che và rào chắn lan can duy trì nghiêm túc; Kiểm tra định kỳ thiết bị nâng hạ đạt chuẩn.",
        },
        {
          name: "ke_hoach_ky_toi",
          label: "Kế hoạch công tác kỳ tiếp theo",
          type: "textarea",
          required: true,
          placeholder: "Vd: Đổ bê tông sàn tầng 13, triển khai lắp dựng giàn giáo tầng 14, hoàn tất nghiệm thu phần thô tầng 8.",
        },
        {
          name: "kien_nghi_chu_dau_tu",
          label: "Kiến nghị và đề xuất giải quyết vướng mắc",
          type: "text",
          required: true,
          placeholder: "Vd: Đề nghị Chủ đầu tư sớm phê duyệt mẫu vật liệu hoàn thiện gạch ốp lát và thiết bị vệ sinh.",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Báo cáo tiến độ tuần thi công xây thô tòa nhà",
        input: {
          ten_du_an: "Tòa nhà hỗn hợp Thương mại & Căn hộ Skylight",
          ban_chi_huy: "Ban Chỉ huy Công trường Delta",
          ky_bao_cao: "Tuần 36 (Từ ngày 28/08/2026 đến 03/09/2026)",
          khoi_luong_hoan_thanh: "Đổ bê tông sàn tầng 18; xây thô căn hộ tầng 12-14 đạt 90%; kéo rải ống luồn dây điện tầng 10-12.",
          danh_gia_tien_do: "Đúng tiến độ cam kết theo phụ lục hợp đồng số 02.",
          cong_tac_an_toan: "An toàn lao động 100%, trang bị đầy đủ bảo hộ, thực hiện kiểm tra an toàn hằng ngày trước giờ giao ban.",
          ke_hoach_ky_toi: "Lắp dựng cốp pha cột vách tầng 19; hoàn thành trát áo tường tầng 10.",
          kien_nghi_chu_dau_tu: "Đề nghị Tư vấn Giám sát bố trí nhân sự nghiệm thu ca đêm công tác đổ bê tông.",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:40%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-size:12pt;">TỔNG CÔNG TY XÂY DỰNG DELTA</p>
      <p style="margin:0; font-weight:bold; font-size:12pt;">BCH CÔNG TRƯỜNG SKYLIGHT</p>
      <p style="margin:2px auto; width:120px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-size:12pt;">Số: 36/BC-BCH</p>
    </td>
    <td style="width:60%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-weight:bold; font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p style="margin:0; font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</p>
      <p style="margin:2px auto; width:160px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-style:italic; font-size:12pt;">Hà Nội, ngày 05 tháng 09 năm 2026</p>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-weight:bold; font-size:15pt; margin:20px 0 5px 0;">BÁO CÁO ĐỊNH KỲ TIẾN ĐỘ THI CÔNG VÀ AN TOÀN LAO ĐỘNG</h2>
<p style="text-align:center; font-style:italic; margin-bottom:20px;">(Kỳ báo cáo: Tuần 36 - Từ 28/08/2026 đến 03/09/2026)</p>

<p style="margin-left:40px;"><strong>Kính gửi:</strong><br/>
- Ban Quản lý Dự án Skylight Tower (Chủ đầu tư);<br/>
- Công ty Tư vấn Quản lý Dự án & Giám sát Xây dựng Coninco.</p>

<p>Ban Chỉ huy Công trường xin trân trọng báo cáo tình hình thi công và an toàn lao động tại dự án trong tuần vừa qua như sau:</p>

<p><strong>1. Khối lượng thi công hoàn thành trong kỳ:</strong><br/>
- Thi công kết cấu: Hoàn thành nghiệm thu và đổ bê tông sàn tầng 18 (Khối lượng 380m3 bê tông, 42 tấn cốt thép);<br/>
- Công tác hoàn thiện xây thô: Xây tường ngăn căn hộ tầng 12, 13, 14 đạt 90% khối lượng;<br/>
- Công tác cơ điện (MEP): Đặt ống chờ và kéo rải ống luồn dây điện âm sàn tầng 10 đến tầng 12.</p>

<p><strong>2. Đánh giá tiến độ:</strong><br/>
- So với tiến độ tổng thể đã được duyệt: <strong>Đúng kế hoạch</strong> (Hoàn thành chu kỳ sàn 6 ngày/sàn);<br/>
- Tình hình huy động nhân lực máy móc: 180 công nhân trực tiếp, 2 cần trục tháp và 1 vận thăng lồng hoạt động ổn định.</p>

<p><strong>3. Công tác An toàn lao động, Vệ sinh môi trường & PCCC:</strong><br/>
- Duy trì họp phổ biến an toàn đầu giờ (Toolbox Meeting) 100% các buổi sáng;<br/>
- Lưới an toàn chống rơi quanh chu vi tòa nhà được căng bảo vệ đầy đủ;<br/>
- Trong kỳ không xảy ra bất kỳ sự cố tai nạn lao động nào.</p>

<p><strong>4. Kế hoạch công tác tuần tiếp theo:</strong><br/>
- Triển khai lắp dựng cốp pha cột vách tầng 19 và gia công cốt thép sàn tầng 19;<br/>
- Tiếp tục công tác xây trát tường căn hộ tầng 14 và 15.</p>

<p><strong>5. Đề xuất và kiến nghị:</strong><br/>
Kính đề nghị Tư vấn Giám sát bố trí cán bộ thường trực nghiệm thu ca đêm để đảm bảo quy trình đổ bê tông các phân đoạn đúng kỹ thuật.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:left; vertical-align:top; border:none;">
      <em>Nơi nhận:</em><br/>
      - Như trên;<br/>
      - Ban Giám đốc Delta (để báo cáo);<br/>
      - Lưu: VT, BCH.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>CHỈ HUY TRƯỞNG CÔNG TRƯỜNG</strong><br/>
      <em>(Ký và ghi rõ họ tên)</em><br/><br/><br/><br/>
      <strong>Nguyễn Thành Trung</strong>
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

  // ==========================================
  // 19. GÓI EDU: KẾ HOẠCH GIẢNG DẠY VÀ CHUYÊN MÔN
  // ==========================================
  {
    id: "edu-teaching-plan",
    categoryId: "education",
    industryPack: "EDU",
    title: "Kế hoạch giảng dạy và công tác chuyên môn",
    description:
      "Kế hoạch phân công giảng dạy, công tác bồi dưỡng học sinh và hoạt động chuyên môn theo từng học kỳ / năm học của trường học.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Kế hoạch giảng dạy và công tác chuyên môn với thông tin sau:
- Cơ quan chủ quản: {{ten_co_quan_chu_quan}}
- Tên trường / Cơ sở giáo dục: {{ten_truong}}
- Năm học: {{nam_hoc}}
- Học kỳ / Giai đoạn: {{hoc_ky}}
- Tổ bộ môn / Khoa chuyên môn: {{to_chuyen_mon}}
- Mục tiêu chung: {{muc_tieu_chung}}
- Nội dung & nhiệm vụ trọng tâm: {{noi_dung_nhiem_vu}}
- Biện pháp thực hiện: {{bien_phap_thuc_hien}}
- Chức danh người ký: {{chuc_danh_nguoi_ky}}
- Họ tên người ký: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "ten_co_quan_chu_quan",
          label: "Cơ quan chủ quản (Sở / Phòng GD&ĐT)",
          type: "text",
          required: true,
          placeholder: "Vd: SỞ GIÁO DỤC VÀ ĐÀO TẠO THÀNH PHỐ HÀ NỘI",
        },
        {
          name: "ten_truong",
          label: "Tên trường / Đơn vị",
          type: "text",
          required: true,
          placeholder: "Vd: TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM",
        },
        {
          name: "nam_hoc",
          label: "Năm học",
          type: "text",
          required: true,
          placeholder: "Vd: 2026 - 2027",
        },
        {
          name: "hoc_ky",
          label: "Học kỳ / Giai đoạn kế hoạch",
          type: "text",
          required: true,
          placeholder: "Vd: Học kỳ I năm học 2026 - 2027",
        },
        {
          name: "to_chuyen_mon",
          label: "Tổ chuyên môn / Khoa",
          type: "text",
          required: true,
          placeholder: "Vd: Tổ Toán - Tin học",
        },
        {
          name: "muc_tieu_chung",
          label: "Mục tiêu trọng tâm",
          type: "textarea",
          required: true,
          placeholder: "Vd: Nâng cao chất lượng dạy học theo Chương trình GDPT 2018; Phấn đấu 100% học sinh đạt yêu cầu, 65% đạt Giỏi và Xuất sắc.",
        },
        {
          name: "noi_dung_nhiem_vu",
          label: "Nhiệm vụ cụ thể & Phân công chuyên môn",
          type: "textarea",
          required: true,
          placeholder: "Vd: Thực hiện nghiêm túc phân phối chương trình; Tổ chức 04 chuyên đề đổi mới phương pháp dạy học; Bồi dưỡng đội tuyển HSG cấp tỉnh/thành phố.",
        },
        {
          name: "bien_phap_thuc_hien",
          label: "Biện pháp thực hiện",
          type: "textarea",
          required: true,
          placeholder: "Vd: Tăng cường ứng dụng CNTT và AI trong soạn giảng; Dự giờ thăm lớp định kỳ 2 tiết/giáo viên/tháng; Kiểm tra đánh giá công bằng khách quan.",
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người ký duyệt",
          type: "text",
          required: true,
          placeholder: "Vd: HIỆU TRƯỞNG",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người ký duyệt",
          type: "text",
          required: true,
          placeholder: "Vd: TS. Bùi Thị Minh Hằng",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Kế hoạch giảng dạy học kỳ I môn Toán THPT",
        input: {
          ten_co_quan_chu_quan: "SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HÀ NỘI",
          ten_truong: "TRƯỜNG THPT CHUYÊN HÀ NỘI - AMSTERDAM",
          nam_hoc: "2026 - 2027",
          hoc_ky: "Học kỳ I",
          to_chuyen_mon: "Tổ Toán - Tin học",
          muc_tieu_chung: "Đảm bảo tiến độ chương trình GDPT 2018, phát triển năng lực tư duy toán học và đạt giải cao tại kỳ thi HSG quốc gia.",
          noi_dung_nhiem_vu: "Triển khai dạy học 18 tuần thực học; Tổ chức 02 hội thảo chuyên đề ứng dụng Geogebra trong giảng dạy hình học không gian.",
          bien_phap_thuc_hien: "Đẩy mạnh sinh hoạt chuyên môn theo nghiên cứu bài học; Tổ chức kiểm tra khảo sát chất lượng giữa kỳ nghiêm túc.",
          chuc_danh_nguoi_ky: "HIỆU TRƯỞNG",
          ho_ten_nguoi_ky: "Trần Thị Mai Phương",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:45%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-size:12pt;">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HÀ NỘI</p>
      <p style="margin:0; font-weight:bold; font-size:12pt;">TRƯỜNG THPT CHUYÊN HN - AMSTERDAM</p>
      <p style="margin:2px auto; width:120px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-size:12pt;">Số: 45/KH-THPT</p>
    </td>
    <td style="width:55%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-weight:bold; font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p style="margin:0; font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</p>
      <p style="margin:2px auto; width:160px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-style:italic; font-size:12pt;">Hà Nội, ngày 05 tháng 09 năm 2026</p>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-weight:bold; font-size:15pt; margin:20px 0 5px 0;">KẾ HOẠCH</h2>
<p style="text-align:center; font-weight:bold; margin-bottom:20px;">Công tác giảng dạy và hoạt động chuyên môn Học kỳ I Năm học 2026 - 2027</p>

<p><em>- Căn cứ Chỉ thị nhiệm vụ năm học 2026 - 2027 của Bộ Giáo dục và Đào tạo;</em></p>
<p><em>- Căn cứ Hướng dẫn thực hiện nhiệm vụ giáo dục trung học của Sở GD&ĐT Hà Nội;</em></p>
<p><em>- Căn cứ Kế hoạch giáo dục nhà trường năm học 2026 - 2027 của Trường THPT Chuyên Hà Nội - Amsterdam.</em></p>

<p>Trường THPT Chuyên Hà Nội - Amsterdam ban hành Kế hoạch công tác giảng dạy và hoạt động chuyên môn Học kỳ I với các nội dung trọng tâm sau:</p>

<p><strong>I. MỤC TIÊU VÀ CHỈ TIÊU PHẤN ĐẤU</strong><br/>
1. 100% cán bộ, giáo viên thực hiện nghiêm túc Quy chế chuyên môn và chương trình giáo dục đã phê duyệt.<br/>
2. Tỷ lệ học sinh xếp loại kết quả học tập Tốt (Giỏi, Xuất sắc) đạt trên 95%; không có học sinh Chưa đạt.<br/>
3. Phấn đấu 100% học sinh đội tuyển dự thi Học sinh giỏi các cấp đạt giải.</p>

<p><strong>II. NHIỆM VỤ VÀ NỘI DUNG CÔNG TÁC TRỌNG TÂM</strong><br/>
1. Thực hiện nghiêm túc tiến độ chương trình 18 tuần thực học theo biên chế thời gian năm học.<br/>
2. Đổi mới phương pháp dạy học và hình thức kiểm tra đánh giá theo định hướng phát triển phẩm chất, năng lực người học.<br/>
3. Tổ chức định kỳ sinh hoạt tổ chuyên môn 2 tuần/lần; chú trọng đổi mới sinh hoạt chuyên môn theo nghiên cứu bài học.</p>

<p><strong>III. BIỆN PHÁP TỔ CHỨC THỰC HIỆN</strong><br/>
1. Ban Giám hiệu trực tiếp chỉ đạo, kiểm tra định kỳ và đột xuất hoạt động sư phạm của giáo viên.<br/>
2. Tổ trưởng chuyên môn chịu trách nhiệm trước Hiệu trưởng về chất lượng giảng dạy của tổ.<br/>
3. Đẩy mạnh ứng dụng công nghệ thông tin và chuyển đổi số trong quản lý hồ sơ sổ sách điện tử.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:left; vertical-align:top; border:none;">
      <em>Nơi nhận:</em><br/>
      - Sở GD&ĐT Hà Nội (để b/c);<br/>
      - Các Tổ chuyên môn (để t/h);<br/>
      - Lưu: VT, CM.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>HIỆU TRƯỞNG</strong><br/>
      <em>(Ký và đóng dấu)</em><br/><br/><br/><br/>
      <strong>Trần Thị Mai Phương</strong>
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

  // ==========================================
  // 20. GÓI EDU: ĐỀ XUẤT TỔ CHỨC HỘI THẢO KHOA HỌC / CHUYÊN ĐỀ SƯ PHẠM
  // ==========================================
  {
    id: "edu-scientific-seminar-proposal",
    categoryId: "education",
    industryPack: "EDU",
    title: "Đề xuất tổ chức Hội thảo khoa học / Chuyên đề sư phạm",
    description:
      "Tờ trình / Đề xuất của Khoa / Tổ bộ môn trình Ban Giám hiệu phê duyệt kế hoạch tổ chức Hội thảo khoa học hoặc Hội thi giáo viên dạy giỏi.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Đề xuất tổ chức Hội thảo khoa học / Chuyên đề sư phạm với thông tin sau:
- Tên trường / Cơ sở giáo dục: {{ten_truong}}
- Đơn vị đề xuất: {{don_vi_de_xuat}}
- Tên hội thảo / Chuyên đề: {{ten_hoi_thao}}
- Mục đích & ý nghĩa: {{muc_dich_y_nghia}}
- Thời gian & địa điểm dự kiến: {{thoi_gian_dia_diem}}
- Thành phần tham dự: {{thanh_phan_tham_du}}
- Dự toán kinh phí: {{du_toan_kinh_phi}}
- Chức danh người đề xuất: {{chuc_danh_nguoi_ky}}
- Họ tên người đề xuất: {{ho_ten_nguoi_ky}}`,
    formSchema: {
      fields: [
        {
          name: "ten_truong",
          label: "Tên trường / Viện đào tạo",
          type: "text",
          required: true,
          placeholder: "Vd: TRƯỜNG ĐẠI HỌC SƯ PHẠM HÀ NỘI",
        },
        {
          name: "don_vi_de_xuat",
          label: "Khoa / Tổ chuyên môn đề xuất",
          type: "text",
          required: true,
          placeholder: "Vd: KHOA CÔNG NGHỆ THÔNG TIN",
        },
        {
          name: "ten_hoi_thao",
          label: "Tên Hội thảo / Chuyên đề sư phạm",
          type: "text",
          required: true,
          placeholder: "Vd: Ứng dụng Trí tuệ Nhân tạo (AI) tạo sinh trong đổi mới phương pháp giảng dạy đại học",
        },
        {
          name: "muc_dich_y_nghia",
          label: "Mục đích và ý nghĩa khoa học",
          type: "textarea",
          required: true,
          placeholder: "Vd: Tạo diễn đàn học thuật trao đổi kinh nghiệm ứng dụng AI; Nâng cao năng lực số cho giảng viên.",
        },
        {
          name: "thoi_gian_dia_diem",
          label: "Thời gian & địa điểm tổ chức",
          type: "text",
          required: true,
          placeholder: "Vd: 08h00 ngày 25 tháng 10 năm 2026 tại Hội trường K1",
        },
        {
          name: "thanh_phan_tham_du",
          label: "Thành phần tham dự và diễn giả",
          type: "text",
          required: true,
          placeholder: "Vd: Khoảng 150 đại biểu gồm Ban Giám hiệu, chuyên gia Viện CNTT, toàn thể giảng viên và học viên cao học",
        },
        {
          name: "du_toan_kinh_phi",
          label: "Dự toán kinh phí dự kiến",
          type: "text",
          required: true,
          placeholder: "Vd: 45.000.000 đ (Bốn mươi lăm triệu đồng từ nguồn kinh phí NCKH của trường)",
        },
        {
          name: "chuc_danh_nguoi_ky",
          label: "Chức danh người đề xuất",
          type: "text",
          required: true,
          placeholder: "Vd: TRƯỞNG KHOA",
        },
        {
          name: "ho_ten_nguoi_ky",
          label: "Họ và tên người đề xuất",
          type: "text",
          required: true,
          placeholder: "Vd: PGS.TS. Nguyễn Văn Hoà",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Tờ trình xin phép tổ chức hội thảo khoa học cấp trường",
        input: {
          ten_truong: "TRƯỜNG ĐẠI HỌC KHOA HỌC XÃ HỘI VÀ NHÂN VĂN",
          don_vi_de_xuat: "KHOA BÁO CHÍ VÀ TRUYỀN THÔNG",
          ten_hoi_thao: "Chuyển đổi số và đạo đức báo chí trong kỷ nguyên AI",
          muc_dich_y_nghia: "Thảo luận các thách thức pháp lý và chuẩn mực đạo đức nghề nghiệp khi ứng dụng AI trong sáng tạo nội dung.",
          thoi_gian_dia_diem: "08h30 ngày 18 tháng 11 năm 2026 tại Hội trường Tầng 8 nhà E",
          thanh_phan_tham_du: "Ban Giám hiệu, đại diện Hội Nhà báo Việt Nam, các cơ quan báo chí và giảng viên trong trường.",
          du_toan_kinh_phi: "35.000.000 đ (Ba mươi lăm triệu đồng)",
          chuc_danh_nguoi_ky: "TRƯỞNG KHOA",
          ho_ten_nguoi_ky: "PGS.TS. Đặng Thị Thu Hương",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:45%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-size:12pt;">ĐẠI HỌC QUỐC GIA HÀ NỘI</p>
      <p style="margin:0; font-weight:bold; font-size:12pt;">TRƯỜNG ĐH KHXH&NV</p>
      <p style="margin:2px auto; width:120px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-size:12pt;">Số: 19/TTr-BC&TT</p>
    </td>
    <td style="width:55%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-weight:bold; font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p style="margin:0; font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</p>
      <p style="margin:2px auto; width:160px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-style:italic; font-size:12pt;">Hà Nội, ngày 05 tháng 09 năm 2026</p>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-weight:bold; font-size:15pt; margin:20px 0 5px 0;">TỜ TRÌNH</h2>
<p style="text-align:center; font-style:italic; margin-bottom:20px;">V/v Đề xuất tổ chức Hội thảo khoa học: &ldquo;Chuyển đổi số và đạo đức báo chí trong kỷ nguyên AI&rdquo;</p>

<p style="margin-left:40px;"><strong>Kính gửi:</strong> Ban Giám hiệu Trường Đại học Khoa học Xã hội và Nhân văn.</p>

<p><em>- Căn cứ Kế hoạch hoạt động Khoa học và Công nghệ năm học 2026 - 2027 của Nhà trường;</em></p>
<p><em>- Căn cứ nhu cầu nghiên cứu, giảng dạy thực tiễn của Khoa Báo chí và Truyền thông.</em></p>

<p>Khoa Báo chí và Truyền thông kính trình Ban Giám hiệu xem xét và phê duyệt kế hoạch tổ chức Hội thảo khoa học cấp trường với các nội dung chi tiết sau:</p>

<p><strong>1. Tên hội thảo:</strong> &ldquo;Chuyển đổi số và đạo đức báo chí trong kỷ nguyên AI&rdquo;.</p>
<p><strong>2. Mục đích và ý nghĩa:</strong><br/>
Tạo diễn đàn trao đổi giữa các nhà khoa học, chuyên gia công nghệ và các nhà báo uy tín nhằm làm rõ những cơ hội, thách thức và chuẩn mực đạo đức nghề nghiệp khi ứng dụng các mô hình ngôn ngữ lớn (LLM) trong sáng tạo báo chí truyền thông.</p>

<p><strong>3. Thời gian và địa điểm:</strong><br/>
- Thời gian: 08 giờ 30 phút, ngày 18 tháng 11 năm 2026.<br/>
- Địa điểm: Hội trường Tầng 8 nhà E, Trường ĐH KHXH&NV (336 Nguyễn Trãi, Thanh Xuân, Hà Nội).</p>

<p><strong>4. Dự toán kinh phí thực hiện:</strong><br/>
Tổng kinh phí dự kiến: <strong>35.000.000 đ</strong> (Ba mươi lăm triệu đồng chẵn). Đề nghị trích từ nguồn Quỹ phát triển hoạt động khoa học và công nghệ của Nhà trường.</p>

<p>Kính đề nghị Ban Giám hiệu xem xét, phê duyệt chủ trương và giao các Phòng chức năng phối hợp thực hiện.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:left; vertical-align:top; border:none;">
      <em>Nơi nhận:</em><br/>
      - Như trên;<br/>
      - Phòng KH&CN (phối hợp);<br/>
      - Lưu: VT, Khoa.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>TRƯỞNG KHOA</strong><br/>
      <em>(Ký và ghi rõ họ tên)</em><br/><br/><br/><br/>
      <strong>Đặng Thị Thu Hương</strong>
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

  // ==========================================
  // 21. GÓI EDU: BÁO CÁO TỔNG KẾT THI ĐUA VÀ KẾT QUẢ HỌC TẬP
  // ==========================================
  {
    id: "edu-period-summary-report",
    categoryId: "education",
    industryPack: "EDU",
    title: "Báo cáo tổng kết phong trào thi đua và kết quả học tập",
    description:
      "Báo cáo toàn diện kết quả thực hiện nhiệm vụ năm học, xếp loại hạnh kiểm, học lực và các thành tích nổi bật của nhà trường / khối lớp.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Báo cáo tổng kết phong trào thi đua và kết quả học tập với thông tin sau:
- Tên trường học: {{ten_truong}}
- Năm học báo cáo: {{nam_hoc}}
- Tổng số học sinh: {{so_luong_hoc_sinh}}
- Kết quả học tập: {{ket_qua_hoc_tap}}
- Kết quả rèn luyện: {{ket_qua_ren_luyen}}
- Thành tích nổi bật & Giải thưởng: {{thanh_tich_noi_bat}}
- Tồn tại & Hạn chế: {{ton_tai_han_che}}
- Phương hướng nhiệm vụ tiếp theo: {{phuong_huong_nhiem_vu}}
- Họ tên Hiệu trưởng: {{ho_ten_hieu_truong}}`,
    formSchema: {
      fields: [
        {
          name: "ten_truong",
          label: "Tên trường học",
          type: "text",
          required: true,
          placeholder: "Vd: TRƯỜNG TIỂU HỌC VÀ THCS ĐOÀN THỊ ĐIỂM",
        },
        {
          name: "nam_hoc",
          label: "Năm học báo cáo",
          type: "text",
          required: true,
          placeholder: "Vd: Năm học 2025 - 2026",
        },
        {
          name: "so_luong_hoc_sinh",
          label: "Quy mô số lớp & Tổng số học sinh",
          type: "text",
          required: true,
          placeholder: "Vd: Toàn trường có 45 lớp với tổng số 1.680 học sinh",
        },
        {
          name: "ket_qua_hoc_tap",
          label: "Kết quả học tập (Tỷ lệ % các mức xếp loại)",
          type: "textarea",
          required: true,
          placeholder: "Vd: Học sinh Xuất sắc: 520 em (30,95%), Học sinh Giỏi: 780 em (46,43%), Học sinh Khá: 350 em (20,83%), Đạt: 30 em (1,79%).",
        },
        {
          name: "ket_qua_ren_luyen",
          label: "Kết quả rèn luyện đạo đức / Hạnh kiểm",
          type: "textarea",
          required: true,
          placeholder: "Vd: Đạt mức Tốt: 1.612 em (96%), Khá: 68 em (4%), Không có học sinh xếp loại rèn luyện Chưa đạt.",
        },
        {
          name: "thanh_tich_noi_bat",
          label: "Thành tích thi đua nổi bật & Giải thưởng",
          type: "textarea",
          required: true,
          placeholder: "Vd: Đạt 15 huy chương cấp quốc gia môn Toán và Tiếng Anh; Tập thể trường nhận Cờ thi đua xuất sắc của UBND Thành phố.",
        },
        {
          name: "ton_tai_han_che",
          label: "Tồn tại, hạn chế cần khắc phục",
          type: "text",
          required: true,
          placeholder: "Vd: Một số học sinh còn thiếu kỹ năng tự học; CSVC phòng thí nghiệm STEM cần được đầu tư thêm.",
        },
        {
          name: "phuong_huong_nhiem_vu",
          label: "Phương hướng nhiệm vụ năm học tới",
          type: "textarea",
          required: true,
          placeholder: "Vd: Tiếp tục nâng cao chất lượng giáo dục toàn diện; Đẩy mạnh giáo dục kỹ năng số và ngoại ngữ chuẩn quốc tế.",
        },
        {
          name: "ho_ten_hieu_truong",
          label: "Họ và tên Hiệu trưởng",
          type: "text",
          required: true,
          placeholder: "Vd: NGƯT. Nguyễn Hồng Thúy",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Báo cáo tổng kết năm học trường phổ thông liên cấp",
        input: {
          ten_truong: "TRƯỜNG PHỔ THÔNG LIÊN CẤP NGUYỄN SIÊU",
          nam_hoc: "2025 - 2026",
          so_luong_hoc_sinh: "1.450 học sinh (52 lớp)",
          ket_qua_hoc_tap: "Học sinh Xuất sắc: 35%; Học sinh Tiêu biểu: 55%; Hoàn thành: 10%.",
          ket_qua_ren_luyen: "Hạnh kiểm Tốt đạt 98,5%, không có vi phạm kỷ luật.",
          thanh_tich_noi_bat: "Đạt giải Nhất cuộc thi Sáng tạo Robot trẻ cấp Quốc gia; 100% học sinh khối 12 đỗ đại học nguyện vọng 1.",
          ton_tai_han_che: "Áp lực học tập giai đoạn thi chuyển cấp còn cao ở một bộ phận học sinh.",
          phuong_huong_nhiem_vu: "Tăng cường tư vấn tâm lý học đường, mở rộng câu lạc bộ kỹ năng mềm.",
          ho_ten_hieu_truong: "ThS. Nguyễn Thị Minh Thúy",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:45%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-size:12pt;">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HÀ NỘI</p>
      <p style="margin:0; font-weight:bold; font-size:12pt;">TRƯỜNG NGUYỄN SIÊU</p>
      <p style="margin:2px auto; width:120px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-size:12pt;">Số: 88/BC-THPT</p>
    </td>
    <td style="width:55%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-weight:bold; font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p style="margin:0; font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</p>
      <p style="margin:2px auto; width:160px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-style:italic; font-size:12pt;">Hà Nội, ngày 05 tháng 09 năm 2026</p>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-weight:bold; font-size:15pt; margin:20px 0 5px 0;">BÁO CÁO</h2>
<p style="text-align:center; font-weight:bold; margin-bottom:20px;">Tổng kết phong trào thi đua và kết quả học tập Năm học 2025 - 2026</p>

<p>Thực hiện nhiệm vụ năm học theo hướng dẫn của ngành Giáo dục, Trường Phổ thông Liên cấp Nguyễn Siêu trân trọng báo cáo kết quả phong trào thi đua và học tập của học sinh như sau:</p>

<p><strong>1. Quy mô trường lớp và học sinh:</strong><br/>
- Tổng số lớp học: 52 lớp với 1.450 học sinh.<br/>
- Tỷ lệ duy trì sĩ số học sinh đạt 100%, không có học sinh bỏ học giữa chừng.</p>

<p><strong>2. Kết quả học tập và rèn luyện:</strong><br/>
- Kết quả học tập: Học sinh Xuất sắc chiếm 35%; Học sinh Tiêu biểu chiếm 55%; Hoàn thành chiếm 10%.<br/>
- Kết quả rèn luyện (Hạnh kiểm): Tỷ lệ Tốt đạt 98,5%; Khá đạt 1,5%; Không có học sinh Chưa đạt.</p>

<p><strong>3. Thành tích nổi bật:</strong><br/>
- Đạt Giải Nhất cuộc thi Sáng tạo Robot trẻ cấp Quốc gia năm 2026.<br/>
- 100% học sinh khối 12 tốt nghiệp THPT và trúng tuyển vào các trường đại học uy tín trong nước và quốc tế.</p>

<p><strong>4. Phương hướng năm học 2026 - 2027:</strong><br/>
Tiếp tục đổi mới mạnh mẽ phương pháp dạy học, tăng cường hoạt động trải nghiệm sáng tạo, tư vấn tâm lý học đường và xây dựng mô hình trường học hạnh phúc.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:left; vertical-align:top; border:none;">
      <em>Nơi nhận:</em><br/>
      - Sở GD&ĐT Hà Nội (để b/c);<br/>
      - HĐQT & BGH nhà trường;<br/>
      - Lưu: VT, ĐT.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>HIỆU TRƯỞNG</strong><br/>
      <em>(Ký và đóng dấu)</em><br/><br/><br/><br/>
      <strong>Nguyễn Thị Minh Thúy</strong>
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

  // ==========================================
  // 22. GÓI EDU: GIẤY MỜI HỌP PHỤ HUYNH HỌC SINH
  // ==========================================
  {
    id: "edu-parent-invitation",
    categoryId: "education",
    industryPack: "EDU",
    title: "Giấy mời họp phụ huynh học sinh",
    description:
      "Giấy mời trang trọng gửi tới cha mẹ học sinh tham dự phiên họp phụ huynh đầu năm / sơ kết học kỳ / tổng kết năm học.",
    systemPrompt: NGHIDINH30_BASE_SYSTEM_PROMPT,
    userPromptTemplate: `Soạn thảo Giấy mời họp phụ huynh học sinh với thông tin sau:
- Tên trường: {{ten_truong}}
- Lớp học: {{ten_lop}}
- Năm học: {{nam_hoc}}
- Kính gửi phụ huynh em: {{ten_phu_huynh}}
- Thời gian tổ chức: {{thoi_gian_hop}}
- Địa điểm: {{dia_diem_hop}}
- Nội dung cuộc họp: {{noi_dung_cuoc_hop}}
- Giáo viên chủ nhiệm: {{thong_tin_giao_vien}}`,
    formSchema: {
      fields: [
        {
          name: "ten_truong",
          label: "Tên trường học",
          type: "text",
          required: true,
          placeholder: "Vd: TRƯỜNG THPT CHU VĂN AN",
        },
        {
          name: "ten_lop",
          label: "Lớp học",
          type: "text",
          required: true,
          placeholder: "Vd: Lớp 10A1",
        },
        {
          name: "nam_hoc",
          label: "Năm học",
          type: "text",
          required: true,
          placeholder: "Vd: 2026 - 2027",
        },
        {
          name: "ten_phu_huynh",
          label: "Kính gửi Phụ huynh em (Học sinh)",
          type: "text",
          required: true,
          placeholder: "Vd: Phụ huynh em Nguyễn Hoàng Nam",
        },
        {
          name: "thoi_gian_hop",
          label: "Thời gian tổ chức họp",
          type: "text",
          required: true,
          placeholder: "Vd: Vào hồi 08 giờ 30 phút, Chủ Nhật ngày 13 tháng 09 năm 2026",
        },
        {
          name: "dia_diem_hop",
          label: "Địa điểm / Phòng học",
          type: "text",
          required: true,
          placeholder: "Vd: Phòng học số 204, Nhà A, Trường THPT Chu Văn An",
        },
        {
          name: "noi_dung_cuoc_hop",
          label: "Nội dung chính cuộc họp",
          type: "textarea",
          required: true,
          placeholder: "Vd: Báo cáo kế hoạch năm học 2026 - 2027; Bầu Ban đại diện Cha mẹ học sinh lớp; Thống nhất các biện pháp phối hợp giáo dục giữa gia đình và nhà trường.",
        },
        {
          name: "thong_tin_giao_vien",
          label: "Họ tên & SĐT Giáo viên chủ nhiệm",
          type: "text",
          required: true,
          placeholder: "Vd: Cô giáo Lê Thanh Nga - SĐT: 0912.345.678",
        },
      ],
    },
    fewShotExamples: [
      {
        description: "Giấy mời họp phụ huynh đầu năm học lớp 10",
        input: {
          ten_truong: "TRƯỜNG THPT CHU VĂN AN",
          ten_lop: "Lớp 10 Chuyên Toán",
          nam_hoc: "2026 - 2027",
          ten_phu_huynh: "Phụ huynh em Nguyễn Đình Phong",
          thoi_gian_hop: "08h30, Chủ Nhật ngày 13/09/2026",
          dia_diem_hop: "Phòng học 302, Khu nhà Bát Giác",
          noi_dung_cuoc_hop: "Triển khai phương hướng năm học; Thông qua quy chế thi đua và thành lập Ban Đại diện Cha mẹ học sinh.",
          thong_tin_giao_vien: "Thầy giáo Hoàng Trọng Thắng - SĐT: 0988.112.233",
        },
        output_html: `<table style="width:100%; border:none; margin-bottom:20px;">
  <tr>
    <td style="width:45%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-size:12pt;">SỞ GIÁO DỤC VÀ ĐÀO TẠO HÀ NỘI</p>
      <p style="margin:0; font-weight:bold; font-size:12pt;">TRƯỜNG THPT CHU VĂN AN</p>
      <p style="margin:2px auto; width:120px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-size:12pt;">Lớp: 10 Chuyên Toán</p>
    </td>
    <td style="width:55%; text-align:center; vertical-align:top; border:none;">
      <p style="margin:0; font-weight:bold; font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p style="margin:0; font-weight:bold; font-size:13pt;">Độc lập - Tự do - Hạnh phúc</p>
      <p style="margin:2px auto; width:160px; border-bottom:1px solid #000;"></p>
      <p style="margin:0; font-style:italic; font-size:12pt;">Hà Nội, ngày 05 tháng 09 năm 2026</p>
    </td>
  </tr>
</table>

<h2 style="text-align:center; font-weight:bold; font-size:16pt; margin:20px 0 5px 0;">GIẤY MỜI</h2>
<p style="text-align:center; font-weight:bold; font-size:13pt; margin-bottom:20px;">Tham dự phiên họp Cha mẹ học sinh đầu Năm học 2026 - 2027</p>

<p style="text-align:center; margin-bottom:20px;"><strong>Kính gửi:</strong> Ông/Bà Phụ huynh em <strong>[TÊN HỌC SINH]</strong> - Học sinh lớp 10 Chuyên Toán.</p>

<p>Giáo viên chủ nhiệm và Ban Giám hiệu Trường THPT Chu Văn An trân trọng kính mời Ông/Bà tới tham dự phiên họp Cha mẹ học sinh đầu năm học:</p>

<p><strong>1. Thời gian:</strong> Vào hồi <strong>08 giờ 30 phút, Chủ Nhật, ngày 13 tháng 09 năm 2026</strong>.<br/>
<strong>2. Địa điểm:</strong> Phòng học 302, Khu nhà Bát Giác, Trường THPT Chu Văn An (Số 10 phố Thụy Khuê, Tây Hồ, Hà Nội).<br/>
<strong>3. Nội dung cuộc họp:</strong><br/>
- Báo cáo phương hướng, kế hoạch giáo dục và chỉ tiêu phấn đấu của nhà trường và lớp trong năm học 2026 - 2027;<br/>
- Thảo luận các giải pháp phối hợp chặt chẽ giữa gia đình và nhà trường trong việc quản lý và định hướng học tập cho học sinh;<br/>
- Bầu Ban Đại diện Cha mẹ học sinh của lớp năm học 2026 - 2027.</p>

<p>Vì tính chất quan trọng của cuộc họp, rất mong Ông/Bà sắp xếp thời gian tham dự đầy đủ và đúng giờ để buổi họp đạt kết quả tốt đẹp.</p>

<table style="width:100%; border:none; margin-top:35px;">
  <tr>
    <td style="width:50%; text-align:left; vertical-align:top; border:none;">
      <em>Ghi chú:</em><br/>
      - Phụ huynh mang theo giấy mời khi đến họp;<br/>
      - Liên hệ GVCN: <strong>0988.112.233</strong>.
    </td>
    <td style="width:50%; text-align:center; vertical-align:top; border:none;">
      <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/>
      <em>(Ký và ghi rõ họ tên)</em><br/><br/><br/><br/>
      <strong>Hoàng Trọng Thắng</strong>
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


