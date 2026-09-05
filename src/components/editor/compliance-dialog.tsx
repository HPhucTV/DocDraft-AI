"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  Wand2,
  CheckCircle2,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  checkCompliance,
  autoFixComplianceAST,
  ComplianceReport,
} from "@/lib/compliance/compliance-engine";

interface AiSemanticSuggestion {
  originalSentence: string;
  suggestedSentence: string;
  reason: string;
}

interface AiAnalysisResult {
  styleScore?: number;
  toneAssessment?: string;
  semanticSuggestions?: AiSemanticSuggestion[];
}

interface ComplianceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorContent: unknown;
  onApplyFixedContent: (fixedAst: unknown, fixes: string[]) => void;
}

export function ComplianceDialog({
  open,
  onOpenChange,
  editorContent,
  onApplyFixedContent,
}: ComplianceDialogProps) {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [isDeepAuditing, setIsDeepAuditing] = useState(false);
  const [appliedFixes, setAppliedFixes] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);

  // Chạy kiểm tra thể thức khi mở Dialog (asynchronous timeout to avoid cascading renders)
  React.useEffect(() => {
    if (open && editorContent) {
      const timer = setTimeout(() => {
        const rep = checkCompliance(editorContent);
        setReport(rep);
        setAppliedFixes([]);
        setAiAnalysis(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open, editorContent]);

  const handleRefresh = () => {
    if (editorContent) {
      const rep = checkCompliance(editorContent);
      setReport(rep);
      setAppliedFixes([]);
    }
  };

  const handleAutoFix = async () => {
    if (!editorContent) return;
    setIsFixing(true);
    try {
      const result = autoFixComplianceAST(editorContent);
      setAppliedFixes(result.fixesApplied);

      // Cập nhật lại vào Editor Canvas
      onApplyFixedContent(result.fixedAst, result.fixesApplied);

      // Tính lại điểm mới
      const newReport = checkCompliance(result.fixedAst);
      setReport(newReport);
    } catch (err) {
      console.error("Lỗi khi auto-fix:", err);
    } finally {
      setIsFixing(false);
    }
  };

  const handleDeepAiAudit = async () => {
    if (!editorContent) return;
    setIsDeepAuditing(true);
    try {
      const res = await fetch("/api/compliance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentJson: editorContent,
          mode: "ai",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.report) setReport(data.report);
        if (data.aiAnalysis) setAiAnalysis(data.aiAnalysis);
      }
    } catch (err) {
      console.error("Lỗi AI Deep Audit:", err);
    } finally {
      setIsDeepAuditing(false);
    }
  };

  const score = report?.score ?? 100;
  const isExcellent = score >= 90;
  const isGood = score >= 70 && score < 90;

  const scoreBgColor = isExcellent
    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
    : isGood
    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        <DialogHeader className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Bảng Soát lỗi Thể thức (Nghị định 30/2020/NĐ-CP)
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Động cơ kiểm định 7 tiêu chí văn bản hành chính quy chuẩn nhà nước
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="h-8 text-xs gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Quét lại
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* HÀNG TRÊN: ĐIỂM SỐ & THỐNG KÊ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${scoreBgColor}`}
            >
              <div className="text-3xl font-black tracking-tight">{score}/100</div>
              <div className="text-xs font-semibold mt-1">
                {isExcellent
                  ? "Xuất sắc (Đạt chuẩn)"
                  : isGood
                  ? "Khá (Cần lưu ý)"
                  : "Chưa đạt chuẩn NĐ 30"}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {report?.stats.errors || 0}
                </div>
                <div className="text-xs text-slate-500">Lỗi nghiêm trọng</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {report?.stats.warnings || 0}
                </div>
                <div className="text-xs text-slate-500">Cảnh báo thể thức</div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  {report?.stats.infos || 0}
                </div>
                <div className="text-xs text-slate-500">Gợi ý định dạng</div>
              </div>
            </div>
          </div>

          {/* DANH SÁCH SỬA ĐỔI ĐÃ ÁP DỤNG THÀNH CÔNG */}
          {appliedFixes.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Đã tự động sửa thành công {appliedFixes.length} điểm thể thức:
              </div>
              <ul className="text-xs text-emerald-700 dark:text-emerald-300/90 space-y-1 list-disc list-inside">
                {appliedFixes.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI PHÂN TÍCH VĂN PHONG (NẾU ĐÃ CHẠY) */}
          {aiAnalysis && (
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Đánh giá văn phong công vụ (AI Deep Context Audit):
              </div>
              <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
                {aiAnalysis.toneAssessment}
              </p>
              {Array.isArray(aiAnalysis.semanticSuggestions) &&
                aiAnalysis.semanticSuggestions.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {aiAnalysis.semanticSuggestions.map((s: AiSemanticSuggestion, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1"
                      >
                        <div className="text-rose-600 dark:text-rose-400 line-through">
                          {s.originalSentence}
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-300 font-medium">
                          → {s.suggestedSentence}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {s.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}

          {/* DANH SÁCH CHI TIẾT CÁC LỖI / CẢNH BÁO */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chi tiết các tiêu chí kiểm tra ({report?.issues.length || 0})
            </h4>

            {report?.issues.length === 0 ? (
              <div className="p-8 text-center border rounded-xl border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Văn bản hoàn hảo không có lỗi thể thức!
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Đã thỏa mãn đầy đủ các quy tắc theo Nghị định 30/2020/NĐ-CP.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {report?.issues.map((issue) => {
                  const isErr = issue.severity === "error";
                  const isWarn = issue.severity === "warning";

                  const badgeClass = isErr
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    : isWarn
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";

                  return (
                    <div
                      key={issue.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {isErr ? (
                            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          ) : isWarn ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {issue.title}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}
                              >
                                {issue.ruleId}
                              </span>
                              {issue.autoFixable && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                                  Tự động sửa được
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {issue.description}
                            </p>
                            <div className="text-[11px] text-slate-500 italic pt-0.5">
                              💡 {issue.recommendation}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CHÂN DIALOG: CÁC NÚT HÀNH ĐỘNG */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeepAiAudit}
            disabled={isDeepAuditing}
            className="text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300"
          >
            {isDeepAuditing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
            Phân tích AI chuyên sâu
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Đóng
            </Button>

            <Button
              size="sm"
              onClick={handleAutoFix}
              disabled={isFixing || !report?.issues.some((i) => i.autoFixable)}
              className="text-xs gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-sm"
            >
              {isFixing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              Sửa tự động 1-Click
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
