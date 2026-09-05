"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Scale,
  Search,
  Check,
  Building,
  X,
  Plus,
  Loader2,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LegalDocItem {
  id: string;
  docCode: string;
  title: string;
  docType?: string | null;
  issuingAuthority?: string | null;
  status: string;
  fullCitation: string;
}

interface LegalAutocompleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCitation: (citationText: string) => void;
}

const QUICK_TAGS = [
  { label: "Văn thư NĐ 30", query: "30/2020" },
  { label: "Doanh nghiệp", query: "doanh nghiệp" },
  { label: "Lao động", query: "lao động" },
  { label: "Đấu thầu", query: "đấu thầu" },
  { label: "Xây dựng", query: "xây dựng" },
  { label: "Đất đai", query: "đất đai" },
  { label: "Thuế & Hóa đơn", query: "thuế" },
];

export function LegalAutocompleteDialog({
  isOpen,
  onClose,
  onSelectCitation,
}: LegalAutocompleteDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LegalDocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LegalDocItem | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Tìm kiếm debounced
  useEffect(() => {
    if (!isOpen) return;

    let ignore = false;
    const handler = setTimeout(() => {
      setLoading(true);
      fetch(`/api/legal/suggest?q=${encodeURIComponent(query)}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data: LegalDocItem[]) => {
          if (!ignore) {
            setResults(data);
            setSelectedItem((prev) => prev || (data.length > 0 ? data[0] : null));
          }
        })
        .catch((err) => console.error("Lỗi tra cứu pháp lý:", err))
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }, 200);

    return () => {
      ignore = true;
      clearTimeout(handler);
    };
  }, [isOpen, query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleApply = (citation: string) => {
    onSelectCitation(citation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="flex flex-col w-full max-w-2xl rounded-2xl border bg-card shadow-2xl overflow-hidden max-h-[85vh]">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-5 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Tra cứu & Gợi ý Căn cứ Pháp lý (Legal RAG)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Chuẩn hóa trích dẫn theo Nghị định 30/2020/NĐ-CP (TASK-210, TASK-211)
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        {/* Search Bar & Quick Tags */}
        <div className="p-4 border-b bg-background/50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Nhập tên luật, nghị định, thông tư hoặc số hiệu (ví dụ: 30/2020, doanh nghiệp, lao động)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-4 text-xs font-medium shadow-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
            )}
          </div>

          {/* Quick Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-semibold">Gợi ý nhanh:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => setQuery(tag.query)}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-foreground hover:bg-muted hover:border-primary transition-all"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading && results.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Đang tra cứu cơ sở dữ liệu pháp lý...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Không tìm thấy văn bản pháp quy nào khớp với &quot;{query}&quot;.
            </div>
          ) : (
            results.map((doc) => {
              const isSelected = selectedItem?.id === doc.id;
              const isActive = doc.status === "ACTIVE";

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedItem(doc)}
                  className={`group flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-xs"
                      : "bg-card hover:border-border/80 hover:bg-muted/20"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        {doc.docCode}
                      </span>
                      {doc.docType && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {doc.docType}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          isActive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isActive ? "bg-emerald-500" : "bg-muted-foreground"
                          }`}
                        />
                        <span>{isActive ? "Còn hiệu lực" : "Hết hiệu lực"}</span>
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs text-foreground leading-snug line-clamp-1">
                      {doc.title}
                    </h4>

                    {/* Standardized Citation */}
                    <div className="rounded-lg bg-background p-2 border text-[11px] font-times italic text-muted-foreground">
                      &quot;{doc.fullCitation}&quot;
                    </div>

                    {doc.issuingAuthority && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span>Cơ quan ban hành: {doc.issuingAuthority}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(doc.fullCitation);
                    }}
                    className="shrink-0 h-8 text-xs gap-1.5 shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Chèn</span>
                  </Button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t px-5 py-3 bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-primary" />
            <span>Tự động kết thúc bằng dấu chấm phẩy (;) chuẩn Nghị định 30</span>
          </div>

          {selectedItem && (
            <Button
              size="sm"
              onClick={() => handleApply(selectedItem.fullCitation)}
              className="text-xs h-8 gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Chèn văn bản đang chọn</span>
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
