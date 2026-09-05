"use client";

import React from "react";
import { FormField, FormFieldType } from "@/types/form-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  X,
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  ListFilter,
  CheckSquare,
} from "lucide-react";

interface TemplateFieldEditorProps {
  field: FormField;
  index: number;
  totalFields: number;
  onChange: (updated: FormField) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const FIELD_TYPES: { type: FormFieldType; label: string; icon: React.ElementType }[] = [
  { type: "text", label: "Văn bản ngắn (Text)", icon: Type },
  { type: "textarea", label: "Đoạn văn dài (Textarea)", icon: AlignLeft },
  { type: "number", label: "Số lượng (Number)", icon: Hash },
  { type: "currency", label: "Số tiền / Tiền tệ (Currency)", icon: DollarSign },
  { type: "date", label: "Ngày tháng (Date)", icon: Calendar },
  { type: "select", label: "Danh sách chọn (Select)", icon: ListFilter },
  { type: "checkbox", label: "Hộp kiểm Đúng/Sai (Checkbox)", icon: CheckSquare },
];

export function TemplateFieldEditor({
  field,
  index,
  totalFields,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: TemplateFieldEditorProps) {
  const handleNameChange = (val: string) => {
    // Tự động chuẩn hóa slug: lowercase, replace spaces/special chars with underscores
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/_+/g, "_");
    onChange({ ...field, name: slug });
  };

  const handleAddOption = () => {
    const currentOptions = field.options || [];
    const newIdx = currentOptions.length + 1;
    onChange({
      ...field,
      options: [
        ...currentOptions,
        { value: `opt_${newIdx}`, label: `Tùy chọn ${newIdx}` },
      ],
    });
  };

  const handleUpdateOption = (optIdx: number, key: "label" | "value", val: string) => {
    const options = [...(field.options || [])];
    if (options[optIdx]) {
      options[optIdx] = { ...options[optIdx], [key]: val };
      if (key === "label" && !options[optIdx].value) {
        options[optIdx].value = val.toLowerCase().replace(/[^a-z0-9_]/g, "_");
      }
      onChange({ ...field, options });
    }
  };

  const handleRemoveOption = (optIdx: number) => {
    const options = (field.options || []).filter((_, i) => i !== optIdx);
    onChange({ ...field, options });
  };

  const CurrentTypeIcon =
    FIELD_TYPES.find((t) => t.type === field.type)?.icon || Type;

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
      {/* Field Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
            #{index + 1}
          </span>
          <div className="flex items-center gap-2">
            <CurrentTypeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {field.label || "Chưa đặt tên nhãn"}
            </span>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {field.name || "field_name"}
            </code>
          </div>
          {field.required && (
            <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">
              Bắt buộc
            </span>
          )}
        </div>

        {/* Action buttons (Reorder & Delete) */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveUp}
            disabled={index === 0}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Di chuyển lên"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMoveDown}
            disabled={index === totalFields - 1}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Di chuyển xuống"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Xóa trường này"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Field Inputs Grid */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        {/* Nhãn trường */}
        <div className="sm:col-span-1 lg:col-span-5">
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Nhãn hiển thị (Label) <span className="text-destructive">*</span>
          </label>
          <Input
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            placeholder="Ví dụ: Họ và tên người nhận, Số tiền..."
            className="h-9"
          />
        </div>

        {/* Tên biến */}
        <div className="sm:col-span-1 lg:col-span-4">
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Tên biến số (Variable Key) <span className="text-destructive">*</span>
          </label>
          <Input
            value={field.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="ho_ten, so_tien..."
            className="h-9 font-mono text-xs"
          />
        </div>

        {/* Kiểu dữ liệu */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Kiểu dữ liệu
          </label>
          <select
            value={field.type}
            onChange={(e) =>
              onChange({ ...field, type: e.target.value as FormFieldType })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Gợi ý Placeholder */}
        <div className="sm:col-span-1 lg:col-span-8">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Placeholder / Gợi ý nhập liệu
          </label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
            placeholder="Ví dụ: Nhập đầy đủ họ tên theo CCCD..."
            className="h-9"
          />
        </div>

        {/* Bắt buộc (Required toggle) */}
        <div className="flex items-center sm:col-span-1 lg:col-span-4 pt-5">
          <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onChange({ ...field, required: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Trường bắt buộc</span>
          </label>
        </div>
      </div>

      {/* Tùy chọn cho Select Field */}
      {field.type === "select" && (
        <div className="mt-4 rounded-lg bg-muted/40 p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Danh sách các tùy chọn (Options)
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="h-7 text-xs"
            >
              <Plus className="mr-1 h-3 w-3" /> Thêm tùy chọn
            </Button>
          </div>

          <div className="space-y-2">
            {(field.options || []).map((opt, optIdx) => (
              <div key={optIdx} className="flex items-center gap-2">
                <Input
                  value={opt.label}
                  onChange={(e) =>
                    handleUpdateOption(optIdx, "label", e.target.value)
                  }
                  placeholder="Nhãn hiển thị..."
                  className="h-8 text-xs"
                />
                <Input
                  value={opt.value}
                  onChange={(e) =>
                    handleUpdateOption(optIdx, "value", e.target.value)
                  }
                  placeholder="Giá trị (value)..."
                  className="h-8 font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveOption(optIdx)}
                  className="h-8 w-8 text-destructive/70 hover:text-destructive"
                  aria-label="Xóa tùy chọn"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {(!field.options || field.options.length === 0) && (
              <p className="text-xs italic text-muted-foreground">
                Chưa có tùy chọn nào. Bấm &quot;Thêm tùy chọn&quot; để cấu hình menu sổ xuống.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
