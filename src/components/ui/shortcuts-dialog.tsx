"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Keyboard,
  FileText,
  Sparkles,
  Share2,
  Sliders,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";

export interface ShortcutItem {
  keys: string[];
  description: string;
  category: "editor" | "export" | "ai" | "navigation";
}

const SHORTCUTS: ShortcutItem[] = [
  // Soạn thảo
  { keys: ["Ctrl", "S"], description: "Lưu văn bản ngay lập tức", category: "editor" },
  { keys: ["Ctrl", "B"], description: "Ẩn / hiện thanh công cụ bên trái", category: "editor" },
  { keys: ["Ctrl", "Z"], description: "Hoàn tác thay đổi vừa nhập", category: "editor" },
  { keys: ["Ctrl", "Y"], description: "Làm lại thay đổi đã hoàn tác", category: "editor" },
  { keys: ["Ctrl", "Shift", "V"], description: "Dán văn bản thuần không kèm định dạng", category: "editor" },

  // Xuất bản & Chia sẻ
  { keys: ["Ctrl", "Shift", "E"], description: "Xuất tệp Word (.docx) chuẩn thể thức NĐ 30", category: "export" },
  { keys: ["Ctrl", "Shift", "P"], description: "In văn bản hoặc xuất tệp PDF vector", category: "export" },
  { keys: ["Ctrl", "Shift", "S"], description: "Mở menu Chia sẻ & Phân quyền cộng tác", category: "export" },

  // AI & Thể thức NĐ 30
  { keys: ["Ctrl", "/"], description: "Bật / tắt Trợ lý AI DocDraft Chat", category: "ai" },
  { keys: ["Ctrl", "Shift", "C"], description: "Kiểm tra tuân thủ thể thức Nghị định 30/2020", category: "ai" },
  { keys: ["Ctrl", "Shift", "F"], description: "Kích hoạt Smart Fill AI tự động điền các ô [...]", category: "ai" },

  // Điều hướng & Hệ thống
  { keys: ["Ctrl", "K"], description: "Mở Command Palette tìm kiếm & thao tác nhanh", category: "navigation" },
  { keys: ["?"], description: "Mở bảng tra cứu phím tắt này", category: "navigation" },
  { keys: ["Esc"], description: "Đóng cửa sổ modal hoặc menu đang mở", category: "navigation" },
];

const CATEGORY_META = {
  editor: { label: "Soạn thảo văn bản", icon: FileText, color: "text-blue-500" },
  export: { label: "Xuất bản & Chia sẻ", icon: Share2, color: "text-emerald-500" },
  ai: { label: "Trợ lý AI & Chuẩn NĐ 30", icon: Sparkles, color: "text-violet-500" },
  navigation: { label: "Điều hướng & Hệ thống", icon: Sliders, color: "text-amber-500" },
};

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredShortcuts = SHORTCUTS.filter(
    (s) =>
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const categories = ["editor", "export", "ai", "navigation"] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl bg-background">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold tracking-tight">
                Phím Tắt Hệ Thống (Keyboard Shortcuts)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Tăng tốc quy trình soạn thảo và xuất bản văn bản công vụ bằng tổ hợp phím tắt.
              </DialogDescription>
            </div>
          </div>

          {/* Search box */}
          <div className="relative mt-3">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm phím tắt (VD: Lưu, Xuất Word, AI, Ctrl+K)..."
              className="pl-9 h-9 text-xs rounded-xl bg-background border-border/80"
              autoFocus
            />
          </div>
        </DialogHeader>

        {/* Danh sách phím tắt */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Không tìm thấy phím tắt phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;
            </div>
          ) : (
            categories.map((catKey) => {
              const items = filteredShortcuts.filter((s) => s.category === catKey);
              if (items.length === 0) return null;
              const meta = CATEGORY_META[catKey];
              const Icon = meta.icon;

              return (
                <div key={catKey} className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                    <span>{meta.label}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-card hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-xs text-foreground font-medium pr-2">
                          {item.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.keys.map((k, kIdx) => (
                            <kbd
                              key={kIdx}
                              className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-md border border-border/80 bg-muted font-mono text-[11px] font-semibold text-foreground shadow-2xs"
                            >
                              {k}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 px-5 border-t border-border/50 bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Nhấn <kbd className="px-1 py-0.5 rounded bg-muted border font-mono">?</kbd> bất kỳ lúc nào để mở lại bảng này
          </span>
          <span>Hệ thống tương thích macOS (Cmd) & Windows (Ctrl)</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
