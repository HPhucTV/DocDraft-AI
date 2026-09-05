"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/types/form-schema";
import { CustomTemplateInput } from "@/lib/templates/template-service";
import { TemplateFieldEditor } from "./template-field-editor";
import { DynamicFormEngine } from "@/components/forms/dynamic-form-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Save,
  Plus,
  Eye,
  FileCode,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  Sliders,
  Code2,
} from "lucide-react";

interface TemplateBuilderProps {
  initialData?: Partial<CustomTemplateInput>;
  isEditing?: boolean;
}

const DEFAULT_SYSTEM_PROMPT = `BẠN LÀ CHUYÊN GIA PHÁP CHẾ VÀ TRƯỞNG PHÒNG HÀNH CHÍNH CÓ 15 NĂM KINH NGHIỆM TẠI VIỆT NAM.
Nhiệm vụ: Tiếp nhận dữ liệu biến số (JSON) từ người dùng, tạo ra văn bản hoàn chỉnh chuẩn 100% theo Nghị định số 30/2020/NĐ-CP của Chính phủ về công tác văn thư.

QUY TẮC BỐ CỤC BẮT BUỘC:
1. TIÊU NGỮ & QUỐC HIỆU: Dùng layout table 2 cột, border:none:
   - Cột 1 (40%): TÊN ĐƠN VỊ SOẠN THẢO, đường gạch chân nét liền, Số ký hiệu văn bản.
   - Cột 2 (60%): CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM / Độc lập - Tự do - Hạnh phúc, địa danh ngày tháng năm.
2. TÊN LOẠI VĂN BẢN VÀ TRÍCH YẾU: In hoa, căn giữa, in đậm.
3. KÍNH GỬI / NƠI NHẬN: Căn lề trái, rõ ràng.
4. KẾT THÚC & CHỮ KÝ: Layout table 2 cột không viền (Nơi nhận bên trái, Chức danh & Chữ ký bên phải).

QUY TẮC CHỐNG ẢO GIÁC (ANTI-HALLUCINATION GUARDRAILS):
- Tuyệt đối KHÔNG tự ý bịa đặt số liệu, tên người, ngày tháng chưa được cung cấp.
- Mọi thông tin còn thiếu BẮT BUỘC đặt trong dấu ngoặc vuông viết hoa: [TÊN NGƯỜI NHẬN], [SỐ TIỀN CỤ THỂ], [NGÀY BẮT ĐẦU].

OUTPUT: Chỉ trả về chuỗi HTML ngữ nghĩa (table, tr, td, h2, p, strong, em, u).`;

const INDUSTRY_PACKS = [
  { value: "ADMIN", label: "Hành chính - Văn phòng" },
  { value: "LEGAL_CORP", label: "Pháp chế & Doanh nghiệp" },
  { value: "PMO", label: "Ban QLDA & Xây dựng" },
  { value: "EDU", label: "Trường học & Giáo dục" },
  { value: "PROPERTY", label: "BQL Chung cư & Tòa nhà" },
  { value: "HEALTHCARE", label: "Y tế & Bệnh viện" },
  { value: "GENERAL", label: "Dùng chung toàn đơn vị" },
];

const CATEGORIES = [
  { value: "quyet-dinh", label: "Quyết định" },
  { value: "to-trinh", label: "Tờ trình" },
  { value: "hop-dong", label: "Hợp đồng" },
  { value: "bien-ban", label: "Biên bản" },
  { value: "cong-van", label: "Công văn" },
  { value: "thong-bao", label: "Thông báo" },
  { value: "ke-hoach", label: "Kế hoạch" },
  { value: "bao-cao", label: "Báo cáo" },
];

export function TemplateBuilder({
  initialData,
  isEditing = false,
}: TemplateBuilderProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "fields" | "prompt">("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState(initialData?.title || "");
  const [id, setId] = useState(initialData?.id || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [industryPack, setIndustryPack] = useState(
    initialData?.industryPack || "ADMIN"
  );
  const [categoryId, setCategoryId] = useState(
    initialData?.categoryId || "quyet-dinh"
  );
  const [isPublished, setIsPublished] = useState(
    initialData?.isPublished !== undefined ? initialData.isPublished : true
  );

  const [fields, setFields] = useState<FormField[]>(
    initialData?.formSchema?.fields || [
      {
        name: "so_ky_hieu",
        label: "Số ký hiệu văn bản",
        type: "text",
        required: true,
        placeholder: "Ví dụ: 12/QĐ-BQL",
      },
      {
        name: "trich_yeu",
        label: "Trích yếu nội dung",
        type: "textarea",
        required: true,
        placeholder: "Về việc phê duyệt...",
      },
    ]
  );

  const [systemPrompt, setSystemPrompt] = useState(
    initialData?.systemPrompt || DEFAULT_SYSTEM_PROMPT
  );

  const [userPromptTemplate, setUserPromptTemplate] = useState(
    initialData?.userPromptTemplate ||
      `Hãy soạn thảo văn bản với các thông tin sau:
- Số ký hiệu: {{so_ky_hieu}}
- Trích yếu nội dung: {{trich_yeu}}`
  );

  // Helper auto slug generator
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing && (!id || id.startsWith("custom-"))) {
      const slug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setId(`custom-${slug}`);
    }
  };

  // Field manipulation
  const handleAddField = () => {
    const nextIdx = fields.length + 1;
    setFields([
      ...fields,
      {
        name: `truong_moi_${nextIdx}`,
        label: `Trường dữ liệu ${nextIdx}`,
        type: "text",
        required: false,
        placeholder: "",
      },
    ]);
  };

  const handleUpdateField = (index: number, updated: FormField) => {
    const copy = [...fields];
    copy[index] = updated;
    setFields(copy);
  };

  const handleDeleteField = (index: number) => {
    if (fields.length <= 1) {
      alert("Mẫu văn bản phải có ít nhất 1 trường nhập liệu.");
      return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleMoveField = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;
    const copy = [...fields];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setFields(copy);
  };

  const handleInsertVariable = (varName: string) => {
    const tag = `{{${varName}}}`;
    setUserPromptTemplate((prev) => `${prev} ${tag}`);
  };

  // Save template
  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tên mẫu văn bản");
      setActiveTab("general");
      return;
    }

    if (fields.length === 0) {
      setErrorMsg("Vui lòng thêm ít nhất 1 trường nhập liệu");
      setActiveTab("fields");
      return;
    }

    // Check duplicate field names
    const names = fields.map((f) => f.name.trim().toLowerCase());
    const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
    if (duplicates.length > 0) {
      setErrorMsg(`Tên biến bị trùng lặp: ${duplicates.join(", ")}`);
      setActiveTab("fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CustomTemplateInput = {
        id: id.trim() || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        industryPack,
        categoryId,
        systemPrompt: systemPrompt.trim(),
        userPromptTemplate: userPromptTemplate.trim(),
        formSchema: { fields },
        exportConfig: {
          margins: { top: 20, bottom: 20, left: 30, right: 15 },
          defaultFont: "Times New Roman",
          fontSize: 13,
        },
        isPublished,
      };

      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu mẫu văn bản");
      }

      setSuccessMsg("Mẫu văn bản đã được lưu thành công!");
      setTimeout(() => {
        router.push("/admin/templates");
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Top action bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/templates")}
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
            aria-label="Quay lại danh sách"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {isEditing ? "Chỉnh sửa mẫu tùy chỉnh" : "Thiết kế mẫu văn bản mới"}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Tùy biến biểu mẫu, quy chuẩn Prompt và xuất bản dùng chung trong cơ quan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPublished(!isPublished)}
            className="h-10 px-4 text-xs font-medium sm:text-sm"
          >
            {isPublished ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" /> Đang bật xuất bản
              </span>
            ) : (
              <span className="text-muted-foreground">Lưu dưới dạng nháp</span>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="h-10 px-5 text-xs font-semibold sm:text-sm shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Lưu mẫu văn bản
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <Check className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6 flex border-b border-border/80">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "general"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>1. Thiết lập chung</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("fields")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "fields"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>2. Form biến số ({fields.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prompt")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "prompt"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>3. System Prompt & Mẫu sinh AI</span>
        </button>
      </div>

      {/* Tab 1: Thiết lập chung */}
      {activeTab === "general" && (
        <div className="space-y-6 rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Tên mẫu văn bản <span className="text-destructive">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ví dụ: Quyết định khen thưởng đột xuất"
                className="h-10"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Mã định danh (Slug) <span className="text-destructive">*</span>
              </label>
              <Input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="custom-khen-thuong-dot-xuat"
                className="h-10 font-mono text-xs"
                disabled={isEditing}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Định danh duy nhất dùng trong hệ thống (chữ thường, số và dấu gạch ngang).
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Nhóm ngành / Lĩnh vực (Industry Pack)
              </label>
              <select
                value={industryPack}
                onChange={(e) => setIndustryPack(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {INDUSTRY_PACKS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Danh mục thể thức
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-foreground">
              Mô tả tóm tắt mẫu
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ghi chú mục đích sử dụng mẫu, đối tượng áp dụng..."
              className="w-full rounded-md border border-input bg-background p-3 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Form biến số & Schema */}
      {activeTab === "fields" && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Cột trái: Danh sách trường */}
          <div className="space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Danh sách trường nhập liệu
                </h3>
                <p className="text-xs text-muted-foreground">
                  Kéo thả hoặc bấm nút mũi tên để thay đổi thứ tự hiển thị
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddField}
                size="sm"
                className="h-9 gap-1 text-xs"
              >
                <Plus className="h-4 w-4" /> Thêm trường
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <TemplateFieldEditor
                  key={idx}
                  field={field}
                  index={idx}
                  totalFields={fields.length}
                  onChange={(upd) => handleUpdateField(idx, upd)}
                  onDelete={() => handleDeleteField(idx)}
                  onMoveUp={() => handleMoveField(idx, "up")}
                  onMoveDown={() => handleMoveField(idx, "down")}
                />
              ))}
            </div>
          </div>

          {/* Cột phải: Live Preview bằng DynamicFormEngine */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Xem trước biểu mẫu (Live Form)
                  </span>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {fields.length} trường
                </span>
              </div>

              <div className="max-h-[600px] overflow-y-auto pr-1">
                <DynamicFormEngine
                  schema={{ fields }}
                  onSubmit={(data) => {
                    alert(`Dữ liệu mẫu thử:\n${JSON.stringify(data, null, 2)}`);
                  }}
                  submitLabel="Kiểm thử nhập liệu"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Prompt & Mẫu sinh AI */}
      {activeTab === "prompt" && (
        <div className="space-y-6">
          {/* Quick chips để chèn biến số */}
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-foreground">
                Biến số có sẵn (Bấm để chèn vào prompt mẫu bên dưới):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {fields.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => handleInsertVariable(f.name)}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-mono font-medium text-primary hover:bg-primary/15 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  {`{{${f.name}}}`}
                  <span className="text-[10px] text-muted-foreground">({f.label})</span>
                </button>
              ))}
            </div>
          </div>

          {/* User Prompt Template */}
          <div className="rounded-2xl border border-border/70 bg-card p-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Mẫu câu lệnh người dùng (User Prompt Template)
              </label>
              <span className="text-xs text-muted-foreground">
                Cú pháp: <code className="text-primary font-mono">&#123;&#123;ten_bien&#125;&#125;</code>
              </span>
            </div>
            <textarea
              value={userPromptTemplate}
              onChange={(e) => setUserPromptTemplate(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              DocDraft AI sẽ tự động thay thế các biến <code className="font-mono">&#123;&#123;...&#125;&#125;</code> bằng dữ liệu người dùng điền vào biểu mẫu.
            </p>
          </div>

          {/* System Prompt */}
          <div className="rounded-2xl border border-border/70 bg-card p-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                Quy chuẩn System Prompt (Nghị định 30/2020/NĐ-CP & Chống ảo giác)
              </label>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <FileCode className="h-3.5 w-3.5" /> Chuẩn thể thức NĐ 30
              </span>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  );
}
