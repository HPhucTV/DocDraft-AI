"use client";

import React, { useEffect, useState, use } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  Building,
  UserCheck,
  Calendar,
  Hash,
  Award,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface VerificationData {
  is_valid: boolean;
  document_title: string;
  document_type: string;
  issuing_organization: string;
  approved_by: string;
  approver_title: string;
  approval_timestamp: string;
  sha256_integrity_hash: string;
  qr_verify_code: string;
  word_count: number;
  compliance_score?: number;
}

export default function DocumentVerifyPage({
  params,
}: {
  params: Promise<{ qrCode: string }>;
}) {
  const resolvedParams = use(params);
  const { qrCode } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    async function fetchVerification() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/verify/${qrCode}`);
        const json = await res.json();

        if (!res.ok || !json.is_valid) {
          setError(json.error || "Không tìm thấy dữ liệu xác thực cho văn bản này.");
          setData(null);
        } else {
          setData(json);
        }
      } catch {
        setError("Không thể kết nối đến máy chủ xác thực. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    }

    if (qrCode) {
      fetchVerification();
    }
  }, [qrCode]);

  const handleCopyHash = () => {
    if (data?.sha256_integrity_hash) {
      navigator.clipboard.writeText(data.sha256_integrity_hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const formattedDate = data?.approval_timestamp
    ? new Date(data.approval_timestamp).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header thương hiệu */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary font-bold tracking-tight text-lg sm:text-xl">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <FileText className="h-4 w-4" />
            </div>
            <span>DOCDRAFT AI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
            Cổng Tra Cứu & Xác Thực Văn Bản Điện Tử
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Hệ thống xác minh tính toàn vẹn bản gốc theo chuẩn Nghị định 30/2020/NĐ-CP
          </p>
        </div>

        {/* Trạng thái Loading Shimmer */}
        {loading && (
          <div className="rounded-2xl border border-border/80 bg-background/90 p-8 shadow-xl backdrop-blur space-y-6 animate-pulse">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="h-6 w-48 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
              <div className="h-4 w-4/6 rounded bg-muted" />
            </div>
          </div>
        )}

        {/* Trạng thái Lỗi / Không tìm thấy */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-background p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-foreground">
                Xác Thực Không Thành Công
              </h2>
              <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
                {error}
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                Mã tra cứu: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{qrCode}</code>
              </p>
            </div>
            <div className="pt-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Quay về trang chủ</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Trạng thái Xác thực Thành công (100% Verified) */}
        {!loading && data && (
          <div className="rounded-2xl border border-border/80 bg-background/95 p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6 animate-in fade-in zoom-in-95">
            {/* Trust Seal Banner */}
            <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-border/60">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <Award className="h-3.5 w-3.5" />
                  <span>Bản Gốc Hợp Lệ & Toàn Vẹn</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground pt-1">
                  {data.document_title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Phân loại: <span className="font-semibold text-foreground">{data.document_type}</span>
                </p>
              </div>
            </div>

            {/* Chi tiết thẩm quyền & thời gian */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Building className="h-3.5 w-3.5 text-primary" />
                  <span>Cơ quan / Đơn vị ban hành</span>
                </div>
                <p className="font-semibold text-foreground text-sm">
                  {data.issuing_organization}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cán bộ ký duyệt</span>
                </div>
                <p className="font-semibold text-foreground text-sm">
                  {data.approved_by}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">
                  {data.approver_title}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Thời điểm phê duyệt</span>
                </div>
                <p className="font-semibold text-foreground text-sm">
                  {formattedDate} (Giờ VN)
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Award className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Chuẩn thể thức NĐ 30</span>
                </div>
                <p className="font-semibold text-foreground text-sm">
                  {data.compliance_score || 100} / 100 điểm
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Đã kiểm toán đạt chuẩn văn thư
                </p>
              </div>
            </div>

            {/* Cryptographic SHA-256 Integrity Hash */}
            <div className="rounded-xl border border-border/80 bg-slate-900 text-slate-100 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  <span>Mã băm toàn vẹn nội dung (SHA-256 Integrity Hash)</span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyHash}
                  className="h-6 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 gap-1 px-2"
                >
                  {copiedHash ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Đã sao chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="font-mono text-[11px] break-all leading-relaxed text-emerald-400 select-all bg-black/40 p-2 rounded border border-slate-800">
                {data.sha256_integrity_hash}
              </p>
              <p className="text-[10px] text-slate-400">
                Bất kỳ sự thay đổi dù chỉ 1 ký tự trong văn bản sẽ làm thay đổi hoàn toàn chuỗi mã băm này.
              </p>
            </div>

            {/* Footer bản quyền & Điều khoản */}
            <div className="text-center pt-2 space-y-2 text-[11px] text-muted-foreground border-t border-border/50">
              <p>
                Mã QR tra cứu: <span className="font-mono font-medium text-foreground">{data.qr_verify_code}</span>
              </p>
              <p>
                Chứng thực bởi <strong>DOCDRAFT AI Document Verification Engine</strong> — Hệ thống trợ lý văn bản công vụ số 1 Việt Nam.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
