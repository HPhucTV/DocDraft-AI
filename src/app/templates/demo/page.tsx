"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileEdit, Sparkles, Layers } from "lucide-react";
import { DynamicFormEngine } from "@/components/forms/dynamic-form-engine";
import type { FormSchema } from "@/types/form-schema";
import { ThemeToggle } from "@/components/theme-toggle";

const sampleSchemas: Record<string, { title: string; category: string; schema: FormSchema }> = {
  to_trinh_kinh_phi: {
    title: "Tờ trình xin phê duyệt kinh phí dự án",
    category: "Tài chính & Kế hoạch",
    schema: {
      fields: [
        {
          name: "ten_co_quan",
          label: "Tên cơ quan / Đơn vị soạn thảo",
          type: "text",
          required: true,
          placeholder: "Vd: PHÒNG HÀNH CHÍNH - NHÂN SỰ",
          validation: { min_length: 3, max_length: 150 },
        },
        {
          name: "kinh_phi_du_toan",
          label: "Dự toán kinh phí",
          type: "currency",
          required: true,
          placeholder: "Nhập số tiền VNĐ...",
          description: "Tự động phân cách hàng nghìn theo chuẩn tiền tệ Việt Nam (VNĐ).",
        },
        {
          name: "loai_kinh_phi",
          label: "Nguồn kinh phí đề xuất",
          type: "select",
          required: true,
          options: [
            { value: "ngan_sach_cong_ty", label: "Ngân sách chi thường xuyên" },
            { value: "quy_phat_trien", label: "Quỹ đầu tư phát triển" },
            { value: "cong_doan", label: "Quỹ phúc lợi - Công đoàn" },
          ],
        },
        {
          name: "ngay_thuc_hien",
          label: "Thời gian thực hiện dự kiến",
          type: "date",
          required: true,
        },
        {
          name: "ly_do_chi_tiet",
          label: "Mục đích & Lý do chi tiết",
          type: "textarea",
          required: true,
          placeholder: "Nêu rõ sự cần thiết của việc đề xuất cấp kinh phí...",
          validation: { min_length: 15 },
        },
        {
          name: "cam_ket_xac_thuc",
          label: "Cam kết số liệu",
          type: "checkbox",
          required: true,
          placeholder: "Tôi cam kết số liệu kinh phí dự toán là trung thực và chịu trách nhiệm.",
        },
      ],
    },
  },
  quyet_dinh_bo_nhiem: {
    title: "Quyết định bổ nhiệm cán bộ quản lý",
    category: "Nhân sự & Tổ chức",
    schema: {
      fields: [
        {
          name: "ten_co_quan",
          label: "Cơ quan ban hành",
          type: "text",
          required: true,
          placeholder: "Vd: TẬP ĐOÀN CÔNG NGHỆ DOCDRAFT",
        },
        {
          name: "ho_ten_can_bo",
          label: "Họ và tên cán bộ được bổ nhiệm",
          type: "text",
          required: true,
          placeholder: "Vd: Nguyễn Văn A",
          validation: { min_length: 4 },
        },
        {
          name: "chuc_vu_moi",
          label: "Chức vụ bổ nhiệm mới",
          type: "text",
          required: true,
          placeholder: "Vd: Trưởng phòng Hành chính - Tổng hợp",
        },
        {
          name: "muc_luong_phu_cap",
          label: "Hệ số phụ cấp chức vụ (hoặc mức lương)",
          type: "currency",
          required: true,
          placeholder: "Nhập mức phụ cấp / lương VNĐ...",
        },
        {
          name: "ngay_hieu_luc",
          label: "Ngày quyết định có hiệu lực",
          type: "date",
          required: true,
        },
      ],
    },
  },
};

export default function DynamicFormDemoPage() {
  const [selectedKey, setSelectedKey] = useState<string>("to_trinh_kinh_phi");
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTemplate = sampleSchemas[selectedKey];

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    // Simulate brief network or compilation latency
    await new Promise((res) => setTimeout(res, 600));
    setSubmittedData(data);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Về Bảng điều khiển
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">|</span>
          <span className="font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Dynamic Form Engine (JSON Schema + Zod)
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Kiểm thử Động cơ Biểu mẫu tự động
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Trình sinh Biểu mẫu Động từ JSON Schema
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Tự động biên dịch JSON Schema thành các trường nhập liệu tương ứng kèm bộ kiểm thử Zod,
            hỗ trợ định dạng tiền tệ VNĐ và thông báo lỗi tiếng Việt tức thời.
          </p>
        </div>

        {/* Template Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(sampleSchemas).map(([key, item]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedKey(key);
                setSubmittedData(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                selectedKey === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-background border text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Dynamic Form Rendered from JSON Schema */}
          <div className="lg:col-span-7">
            <div className="bg-card border rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b">
                <div>
                  <h2 className="font-semibold text-foreground text-base">
                    {currentTemplate.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Danh mục: {currentTemplate.category}
                  </p>
                </div>
                <span className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                  {currentTemplate.schema.fields.length} trường
                </span>
              </div>

              <DynamicFormEngine
                key={selectedKey}
                schema={currentTemplate.schema}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel="Xác nhận dữ liệu biểu mẫu"
              />
            </div>
          </div>

          {/* Real-time Validated Output Inspector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-card border rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Dữ liệu JSONB sau khi xác thực hợp lệ
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Dữ liệu bên dưới được Zod validate thành công và sẽ được đưa vào Master Prompt để AI
                sinh văn bản chuẩn Nghị định 30.
              </p>

              {submittedData ? (
                <pre className="p-3 bg-neutral-900 text-emerald-400 text-xs rounded-lg overflow-x-auto font-mono max-h-96">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              ) : (
                <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground text-xs">
                  Chưa có dữ liệu. Hãy điền thông tin bên cạnh và bấm nút để kiểm tra kết quả xác thực.
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 text-xs text-blue-900 dark:text-blue-200 space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5" />
                Quy chuẩn Nghiệp vụ đã hoàn tất:
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300">
                <li>Bắt buộc điền: Báo lỗi màu đỏ chi tiết nếu submit form rỗng.</li>
                <li>Tiền tệ VNĐ: Tự động phân cách dấu chấm (vd: 150.000.000 VNĐ).</li>
                <li>Biên dịch tự động Zod Schema theo đặc tả DATA-003.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
