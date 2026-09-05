"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Trash2,
  Cpu,
  Sparkles,
  Lock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

interface KeyStatus {
  configured: boolean;
  maskedKey: string | null;
  updatedAt: string | null;
}

interface KeysResponse {
  deepseek: KeyStatus;
  gemini: KeyStatus;
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<KeysResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // DeepSeek form state
  const [deepseekInput, setDeepseekInput] = useState("");
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [testingDeepseek, setTestingDeepseek] = useState(false);
  const [savingDeepseek, setSavingDeepseek] = useState(false);
  const [deepseekStatus, setDeepseekStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Gemini form state
  const [geminiInput, setGeminiInput] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [savingGemini, setSavingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Reload configured keys
  const refreshKeys = async () => {
    try {
      const res = await fetch("/api/user/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (err) {
      console.error("Lỗi khi tải trạng thái khóa API:", err);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await fetch("/api/user/keys");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setKeys(data);
          }
        }
      } catch (err) {
        console.error("Lỗi khi tải trạng thái khóa API:", err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Test DeepSeek Key
  const handleTestKey = async (provider: "deepseek" | "gemini") => {
    const key = provider === "deepseek" ? deepseekInput : geminiInput;
    const setTesting = provider === "deepseek" ? setTestingDeepseek : setTestingGemini;
    const setStatus = provider === "deepseek" ? setDeepseekStatus : setGeminiStatus;

    if (!key.trim()) {
      setStatus({
        type: "error",
        message: "Vui lòng nhập API Key trước khi kiểm tra kết nối.",
      });
      return;
    }

    setTesting(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/user/keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: key.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({
          type: "success",
          message: data.message || `Kết nối thành công tới ${provider.toUpperCase()} API!`,
        });
      } else {
        setStatus({
          type: "error",
          message: data.error || "Kiểm tra kết nối thất bại.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng";
      setStatus({ type: "error", message: `Lỗi: ${msg}` });
    } finally {
      setTesting(false);
    }
  };

  // Save or Delete Key
  const handleSaveKey = async (provider: "deepseek" | "gemini", action: "save" | "delete") => {
    const key = action === "delete" ? "" : (provider === "deepseek" ? deepseekInput : geminiInput);
    const setSaving = provider === "deepseek" ? setSavingDeepseek : setSavingGemini;
    const setStatus = provider === "deepseek" ? setDeepseekStatus : setGeminiStatus;

    if (action === "save" && !key.trim()) {
      setStatus({
        type: "error",
        message: "Vui lòng nhập khóa API hợp lệ trước khi lưu.",
      });
      return;
    }

    setSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/user/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: action === "delete" ? null : key.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({
          type: "success",
          message: data.message,
        });
        if (provider === "deepseek") setDeepseekInput("");
        if (provider === "gemini") setGeminiInput("");
        await refreshKeys();
      } else {
        setStatus({
          type: "error",
          message: data.error || "Lỗi khi cập nhật khóa API.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi mạng";
      setStatus({ type: "error", message: `Lỗi: ${msg}` });
    } finally {
      setSaving(false);
    }
  };

  const isBYOKActive = Boolean(keys?.deepseek?.configured || keys?.gemini?.configured);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span>Quay lại Dashboard</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-sm font-semibold tracking-tight sm:text-base">
            Cài đặt &bull; Cấu hình BYOK (Bring Your Own Key)
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto max-w-4xl p-6 md:p-8 space-y-8">
        {/* Banner Overview */}
        <div className="rounded-2xl border bg-gradient-to-r from-blue-900/10 via-primary/5 to-transparent p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary mb-2">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Kiến trúc BYOK & Bảo mật AES-256</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Cấu hình API Key Cá Nhân</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Sử dụng API Key của riêng bạn để được ưu tiên xử lý không giới hạn tốc độ (Unlimited Rate Limit).
                Mọi khóa API đều được mã hóa chuẩn quân sự AES-256-GCM trước khi lưu trữ.
              </p>
            </div>

            {/* BYOK Status Badge */}
            <div className="shrink-0">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang kiểm tra...</span>
                </div>
              ) : isBYOKActive ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-emerald-700 dark:text-emerald-400 font-medium text-sm shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="font-semibold text-xs uppercase tracking-wider">BYOK Active</div>
                    <div className="text-xs text-muted-foreground">Unlimited Rate Limit</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-muted border px-4 py-2.5 text-muted-foreground text-sm">
                  <Cpu className="h-5 w-5" />
                  <div>
                    <div className="font-semibold text-xs uppercase tracking-wider">Khóa hệ thống</div>
                    <div className="text-xs">Đang dùng quota dùng chung</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Info Card */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5 text-sm flex gap-3.5 items-start">
          <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-muted-foreground">
            <p className="font-medium text-foreground">Cam kết bảo mật tuyệt đối</p>
            <p className="text-xs leading-relaxed">
              Khóa API được mã hóa bằng thuật toán <strong>AES-256-GCM</strong> với vector khởi tạo (IV) ngẫu nhiên 12 bytes
              và thẻ xác thực (Auth Tag). Phía Backend chỉ giải mã trong RAM tạm thời khi thực hiện lệnh sinh văn bản và không bao giờ
              ghi log API Key ra đĩa.
            </p>
          </div>
        </div>

        {/* AI Providers Form Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* DeepSeek Provider Card (Primary) */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 font-bold">
                  DS
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">DeepSeek-V3 API</h3>
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                      Mô hình chính (Primary)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Xử lý sinh văn bản hành chính với tốc độ cao và chi phí tối ưu
                  </p>
                </div>
              </div>

              {keys?.deepseek?.configured && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã cấu hình</span>
                </div>
              )}
            </div>

            {/* Current Config Status */}
            {keys?.deepseek?.configured && (
              <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground">Khóa đang hoạt động:</span>
                  <div className="font-mono font-medium text-foreground">
                    {keys.deepseek.maskedKey || "sk-••••••••"}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleSaveKey("deepseek", "delete")}
                  disabled={savingDeepseek}
                  className="gap-1.5 h-8 text-xs"
                  id="btn-delete-deepseek-key"
                >
                  {savingDeepseek ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  <span>Xóa khóa</span>
                </Button>
              </div>
            )}

            {/* Input Form */}
            <div className="space-y-3">
              <label
                htmlFor="deepseek-key-input"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {keys?.deepseek?.configured ? "Thay thế API Key mới" : "Nhập DeepSeek API Key"}
              </label>

              <div className="relative">
                <Input
                  id="deepseek-key-input"
                  type={showDeepseek ? "text" : "password"}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={deepseekInput}
                  onChange={(e) => setDeepseekInput(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowDeepseek(!showDeepseek)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle visibility"
                >
                  {showDeepseek ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Status feedback */}
              {deepseekStatus.type && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                    deepseekStatus.type === "success"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {deepseekStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{deepseekStatus.message}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <span>Lấy API Key từ DeepSeek Console</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestKey("deepseek")}
                    disabled={testingDeepseek || !deepseekInput.trim()}
                    id="btn-test-deepseek"
                    className="gap-1.5"
                  >
                    {testingDeepseek ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span>Kiểm tra kết nối</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSaveKey("deepseek", "save")}
                    disabled={savingDeepseek || !deepseekInput.trim()}
                    id="btn-save-deepseek"
                    className="gap-1.5"
                  >
                    {savingDeepseek ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    <span>Lưu & Mã hóa</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Gemini Provider Card (Fallback) */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 font-bold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Google Gemini 3.7 Flash API</h3>
                    <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-medium">
                      Dự phòng (Fallback)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tự động kích hoạt khi DeepSeek gặp sự cố gián đoạn hoặc quá tải 5xx
                  </p>
                </div>
              </div>

              {keys?.gemini?.configured && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Đã cấu hình</span>
                </div>
              )}
            </div>

            {/* Current Config Status */}
            {keys?.gemini?.configured && (
              <div className="flex items-center justify-between bg-muted/40 rounded-lg p-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground">Khóa đang hoạt động:</span>
                  <div className="font-mono font-medium text-foreground">
                    {keys.gemini.maskedKey || "AIza••••••••"}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleSaveKey("gemini", "delete")}
                  disabled={savingGemini}
                  className="gap-1.5 h-8 text-xs"
                  id="btn-delete-gemini-key"
                >
                  {savingGemini ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  <span>Xóa khóa</span>
                </Button>
              </div>
            )}

            {/* Input Form */}
            <div className="space-y-3">
              <label
                htmlFor="gemini-key-input"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {keys?.gemini?.configured ? "Thay thế API Key mới" : "Nhập Gemini API Key"}
              </label>

              <div className="relative">
                <Input
                  id="gemini-key-input"
                  type={showGemini ? "text" : "password"}
                  placeholder="AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={geminiInput}
                  onChange={(e) => setGeminiInput(e.target.value)}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle visibility"
                >
                  {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Status feedback */}
              {geminiStatus.type && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                    geminiStatus.type === "success"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {geminiStatus.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{geminiStatus.message}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <span>Lấy API Key từ Google AI Studio</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestKey("gemini")}
                    disabled={testingGemini || !geminiInput.trim()}
                    id="btn-test-gemini"
                    className="gap-1.5"
                  >
                    {testingGemini ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    <span>Kiểm tra kết nối</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleSaveKey("gemini", "save")}
                    disabled={savingGemini || !geminiInput.trim()}
                    id="btn-save-gemini"
                    className="gap-1.5"
                  >
                    {savingGemini ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    <span>Lưu & Mã hóa</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
