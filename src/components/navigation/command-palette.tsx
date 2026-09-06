"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Search,
  PlusCircle,
  FileText,
  Sparkles,
  CheckCircle2,
  Download,
  FolderKanban,
  Building2,
  HelpCircle,
  Moon,
  Sun,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "actions" | "navigation" | "templates" | "system";
  icon: React.ElementType;
  shortcut?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenShortcuts?: () => void;
  onTriggerExportWord?: () => void;
  onTriggerExportPdf?: () => void;
  onTriggerComplianceCheck?: () => void;
  onTriggerSmartFill?: () => void;
  onTriggerAIChat?: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenShortcuts,
  onTriggerExportWord,
  onTriggerExportPdf,
  onTriggerComplianceCheck,
  onTriggerSmartFill,
  onTriggerAIChat,
}: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme || "light";
  const isDark = currentTheme === "dark";
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Bộ điều phối lệnh thông minh: kích hoạt ngay nếu ở /editor, hoặc điều hướng kèm tham số
  const dispatchEditorCommand = (commandId: string, param?: string) => {
    onOpenChange(false);

    if (commandId === "compliance-check") {
      window.dispatchEvent(new CustomEvent("docdraft:open-compliance"));
    }

    // Phát custom event cho trang editor
    window.dispatchEvent(
      new CustomEvent("docdraft:command", {
        detail: { action: commandId, param },
      })
    );

    // Nếu không ở trang editor thì điều hướng
    if (!pathname || !pathname.startsWith("/editor")) {
      const url = param
        ? `/editor?action=${commandId}&param=${encodeURIComponent(param)}`
        : `/editor?action=${commandId}`;
      router.push(url);
    }
  };

  const items: CommandItem[] = [
    // 1. Thao tác nhanh
    {
      id: "create-new-draft",
      title: "Tạo văn bản dự thảo mới",
      subtitle: "Mở hoặc làm mới trình soạn thảo trắng để bắt đầu",
      category: "actions",
      icon: PlusCircle,
      action: () => {
        dispatchEditorCommand("create-new-draft");
      },
    },
    {
      id: "smart-fill",
      title: "Smart Fill: Điền tự động các ô [...]",
      subtitle: "AI quét hồ sơ tổ chức và ngữ cảnh để điền placeholder",
      category: "actions",
      icon: Zap,
      shortcut: ["Ctrl", "Shift", "F"],
      action: () => {
        if (onTriggerSmartFill) {
          onOpenChange(false);
          onTriggerSmartFill();
        } else {
          dispatchEditorCommand("smart-fill");
        }
      },
    },
    {
      id: "ai-copilot",
      title: "Mở Trợ lý AI DocDraft Chat",
      subtitle: "Tra cứu pháp lý, sửa lỗi thể thức, tóm tắt nội dung",
      category: "actions",
      icon: Sparkles,
      shortcut: ["Ctrl", "/"],
      action: () => {
        if (onTriggerAIChat) {
          onOpenChange(false);
          onTriggerAIChat();
        } else {
          dispatchEditorCommand("ai-copilot");
        }
      },
    },
    {
      id: "compliance-check",
      title: "Kiểm tra thể thức Nghị định 30/2020",
      subtitle: "Soát lỗi lề trang, bảng ẩn 2 cột, quốc hiệu, tiêu ngữ",
      category: "actions",
      icon: CheckCircle2,
      shortcut: ["Ctrl", "Shift", "C"],
      action: () => {
        if (onTriggerComplianceCheck) {
          onOpenChange(false);
          onTriggerComplianceCheck();
        } else {
          dispatchEditorCommand("compliance-check");
        }
      },
    },
    {
      id: "export-word",
      title: "Xuất tệp Word (.docx) chuẩn thể thức",
      subtitle: "Tạo tài liệu Word tương thích Microsoft Office",
      category: "actions",
      icon: Download,
      shortcut: ["Ctrl", "Shift", "E"],
      action: () => {
        if (onTriggerExportWord) {
          onOpenChange(false);
          onTriggerExportWord();
        } else {
          dispatchEditorCommand("export-word");
        }
      },
    },
    {
      id: "export-pdf",
      title: "In hoặc xuất tệp PDF vector",
      subtitle: "In trực tiếp hoặc tải PDF chất lượng in ấn",
      category: "actions",
      icon: Download,
      shortcut: ["Ctrl", "Shift", "P"],
      action: () => {
        if (onTriggerExportPdf) {
          onOpenChange(false);
          onTriggerExportPdf();
        } else {
          dispatchEditorCommand("export-pdf");
        }
      },
    },

    // 2. Điều hướng
    {
      id: "nav-dashboard",
      title: "Bảng điều khiển công tác (Dashboard)",
      subtitle: "Quản lý danh sách văn bản, bản nháp và thống kê",
      category: "navigation",
      icon: FolderKanban,
      action: () => {
        onOpenChange(false);
        router.push("/dashboard");
      },
    },
    {
      id: "nav-org-admin",
      title: "Quản trị cơ quan & tổ chức",
      subtitle: "Cấu hình phòng ban, cán bộ lãnh đạo và mẫu nội bộ",
      category: "navigation",
      icon: Building2,
      action: () => {
        onOpenChange(false);
        router.push("/admin/organization");
      },
    },
    {
      id: "nav-word-addin",
      title: "Tiện ích mở rộng Microsoft Word Add-in",
      subtitle: "Soạn thảo văn bản AI trực tiếp trong Microsoft Word desktop",
      category: "navigation",
      icon: FileText,
      action: () => {
        onOpenChange(false);
        router.push("/word-addin");
      },
    },

    // 3. Mẫu văn bản phổ biến
    {
      id: "tpl-to-trinh",
      title: "Mẫu: Tờ trình bổ sung kinh phí / Dự án",
      subtitle: "Mẫu tờ trình hành chính chuẩn Nghị định 30",
      category: "templates",
      icon: FileText,
      action: () => {
        dispatchEditorCommand("template", "to-trinh");
      },
    },
    {
      id: "tpl-cong-van",
      title: "Mẫu: Công văn hành chính",
      subtitle: "Gửi cơ quan cấp trên, phối hợp liên ngành",
      category: "templates",
      icon: FileText,
      action: () => {
        dispatchEditorCommand("template", "cong-van");
      },
    },
    {
      id: "tpl-quyet-dinh",
      title: "Mẫu: Quyết định ban hành quy chế / Bổ nhiệm",
      subtitle: "Quyết định của Thủ trưởng cơ quan, đơn vị",
      category: "templates",
      icon: FileText,
      action: () => {
        dispatchEditorCommand("template", "quyet-dinh");
      },
    },

    // 4. Hệ thống
    {
      id: "sys-shortcuts",
      title: "Bảng tra cứu phím tắt toàn diện",
      subtitle: "Xem toàn bộ tổ hợp phím tắt nhanh của DocDraft AI",
      category: "system",
      icon: HelpCircle,
      shortcut: ["?"],
      action: () => {
        onOpenChange(false);
        if (onOpenShortcuts) onOpenShortcuts();
        window.dispatchEvent(
          new CustomEvent("docdraft:command", { detail: { action: "shortcuts" } })
        );
      },
    },
    {
      id: "sys-theme-toggle",
      title: `Chuyển sang ${isDark ? "Giao diện Sáng" : "Giao diện Tối"}`,
      subtitle: "Thay đổi tông màu hiển thị Dark / Light mode",
      category: "system",
      icon: isDark ? Sun : Moon,
      action: () => {
        setTheme(isDark ? "light" : "dark");
        onOpenChange(false);
      },
    },
  ];

  // Lọc theo query
  const filteredItems = items.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q))
    );
  });

  // Di chuyển bằng bàn phím
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredItems.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  const CATEGORY_NAMES = {
    actions: "Thao tác & Trợ lý AI",
    navigation: "Điều hướng nhanh",
    templates: "Mẫu văn bản tiêu chuẩn",
    system: "Giao diện & Hệ thống",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl bg-background top-[20%] translate-y-0">
        {/* Search input bar */}
        <div className="flex items-center px-4 border-b border-border/60 bg-muted/20">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Gõ lệnh hoặc tìm kiếm (VD: Mở AI, Xuất Word, Tờ trình, Sáng/Tối)..."
            className="w-full h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/80">
            <span>ESC để đóng</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Không tìm thấy lệnh hoặc thao tác nào với từ khóa &ldquo;{query}&rdquo;
            </div>
          ) : (
            (["actions", "navigation", "templates", "system"] as const).map((cat) => {
              const catItems = filteredItems.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {CATEGORY_NAMES[cat]}
                  </div>

                  {catItems.map((item) => {
                    const itemGlobalIndex = filteredItems.indexOf(item);
                    const isSelected = itemGlobalIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          item.action();
                        }}
                        onMouseEnter={() => setSelectedIndex(itemGlobalIndex)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-left cursor-pointer transition-colors border-0 outline-none select-none ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-medium shadow-xs"
                            : "text-foreground hover:bg-muted/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isSelected
                                ? "text-primary-foreground"
                                : "text-muted-foreground"
                            }`}
                          />
                          <div className="truncate">
                            <p className="truncate font-semibold">{item.title}</p>
                            {item.subtitle && (
                              <p
                                className={`text-[11px] truncate mt-0.5 ${
                                  isSelected
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {item.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.shortcut && (
                            <div className="flex items-center gap-0.5">
                              {item.shortcut.map((k, kIdx) => (
                                <kbd
                                  key={kIdx}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                                    isSelected
                                      ? "bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground"
                                      : "bg-muted border-border/80 text-foreground"
                                  }`}
                                >
                                  {k}
                                </kbd>
                              ))}
                            </div>
                          )}

                          {isSelected && (
                            <ArrowRight className="h-3.5 w-3.5 text-primary-foreground ml-1" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 px-4 border-t border-border/50 bg-muted/20 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              Dùng phím <kbd className="px-1 rounded bg-muted border font-mono">↑</kbd> <kbd className="px-1 rounded bg-muted border font-mono">↓</kbd> để di chuyển
            </span>
            <span>
              Nhấn <kbd className="px-1 rounded bg-muted border font-mono">Enter ⏎</kbd> hoặc click để chọn
            </span>
          </div>
          <span>DOCDRAFT AI Command Palette</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
