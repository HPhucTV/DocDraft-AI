"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FileText,
  ShieldCheck,
  Scale,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Bot,
  Users,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage("Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("Đã xảy ra sự cố kết nối tới hệ thống máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setErrorMessage("Không thể kết nối với dịch vụ Google OAuth.");
      setIsGoogleLoading(false);
    }
  };

  // Nạp nhanh tài khoản dùng thử để trải nghiệm
  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Admin@123456");
  };

  return (
    <div className="w-full max-w-[440px] mx-auto">
      {/* Back to home link */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Quay lại trang chủ</span>
        </Link>
      </div>

      {/* Main Login Card Container */}
      <div className="rounded-3xl border border-border/80 bg-card/90 dark:bg-slate-900/80 p-7 sm:p-9 shadow-2xl backdrop-blur-xl transition-all">
        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 shadow-inner shadow-primary/20 md:hidden">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Đăng nhập tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            Truy cập không gian làm việc văn bản hành chính công vụ
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive animate-in fade-in-50 duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full gap-3 text-xs sm:text-sm font-medium border-border/80 hover:bg-muted/60 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>Đăng nhập với Google</span>
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/80" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
            <span className="bg-card px-3 text-muted-foreground/70 dark:bg-slate-900">
              Hoặc tiếp tục với email
            </span>
          </div>
        </div>

        {/* Form Credentials */}
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5" htmlFor="email">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Địa chỉ Email cơ quan</span>
            </label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="ten.canbo@coquan.gov.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading || isGoogleLoading}
                className="h-11 pl-3.5 text-xs sm:text-sm rounded-xl border-border/80 bg-background/50 focus:bg-background transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5" htmlFor="password">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Mật khẩu</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading || isGoogleLoading}
                className="h-11 pl-3.5 pr-10 text-xs sm:text-sm rounded-xl border-border/80 bg-background/50 focus:bg-background transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-600 via-primary to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-primary/25 active:scale-[0.99] transition-all"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xác thực thông tin...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Đăng nhập hệ thống</span>
              </div>
            )}
          </Button>
        </form>

        {/* Demo Fast Account Fill */}
        <div className="mt-5 pt-4 border-t border-border/60">
          <div className="text-[11px] font-medium text-muted-foreground text-center mb-2">
            Tài khoản mẫu trải nghiệm nhanh (Mật khẩu: Admin@123456):
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount("admin@docdraft.vn")}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-muted/50 hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground border border-border/50 transition-all"
            >
              <ShieldCheck className="h-3 w-3 text-blue-500" />
              <span>Quản trị viên (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("lanhdao@docdraft.vn")}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-muted/50 hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground border border-border/50 transition-all"
            >
              <Users className="h-3 w-3 text-indigo-500" />
              <span>Lãnh đạo duyệt</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("chuyenvien@docdraft.vn")}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-muted/50 hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground border border-border/50 transition-all"
            >
              <FileText className="h-3 w-3 text-emerald-500" />
              <span>Chuyên viên soạn</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount("khach@docdraft.vn")}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-muted/50 hover:bg-muted text-[11px] text-muted-foreground hover:text-foreground border border-border/50 transition-all"
            >
              <Eye className="h-3 w-3 text-amber-500" />
              <span>Độc giả chỉ xem</span>
            </button>
          </div>
        </div>

        {/* Register footer link */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Chưa có tài khoản chuyên viên?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>

      {/* Security Compliance Badge at Bottom */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80 text-center">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span>Bảo mật cấp Doanh nghiệp | Tiêu chuẩn ISO 27001 &amp; Nghị định 13/2023/NĐ-CP</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center md:grid md:grid-cols-2 lg:px-0 bg-background overflow-hidden selection:bg-primary/20">
      {/* Top right theme toggle */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <ThemeToggle />
      </div>

      {/* Left Column: Brand Showcase Hero Banner (Aurora Pearl Glassmorphism - AI Feature Focused) */}
      <div className="relative hidden h-full flex-col justify-between overflow-hidden p-8 lg:p-10 md:flex border-r border-border/40 bg-gradient-to-br from-sky-100/70 via-indigo-50/60 to-purple-100/50 dark:from-slate-950 dark:via-[#0a101f] dark:to-slate-900 transition-colors">
        {/* Ambient Gradient Background Glow Mesh */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-sky-400/30 dark:bg-sky-500/20 blur-[110px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-purple-400/30 dark:bg-purple-600/20 blur-[110px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 h-80 w-80 rounded-full bg-blue-400/20 dark:bg-blue-600/15 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))]" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  DOCDRAFT <span className="text-primary font-extrabold">AI</span>
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
                  AI v2.0
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Nền tảng Trí tuệ Nhân tạo Soạn thảo Văn bản Thông minh
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Floating Glassmorphic AI Workspace Showcase */}
        <div className="relative z-10 my-auto py-6 max-w-lg w-full">
          {/* Main Workspace Card */}
          <div className="relative rounded-3xl border border-white/80 dark:border-white/10 bg-white/75 dark:bg-white/5 p-6 sm:p-7 shadow-[0_20px_50px_rgba(37,99,235,0.10)] dark:shadow-2xl backdrop-blur-2xl transition-all">
            {/* Card Header Title */}
            <div className="flex items-center justify-between pb-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground ml-1">
                  Smart Document • AI Live Drafting
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: "4s" }} />
                <span>DocDraft AI Core</span>
              </div>
            </div>

            {/* Showcase Canvas Title */}
            <div className="pt-4 pb-1 text-center">
              <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
                <span>TRỢ LÝ AI SOẠN THẢO THÔNG MINH</span>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tự động hóa xây dựng điều khoản, hợp đồng và văn bản trong 3 giây
              </p>
            </div>

            {/* Live AI Generation Preview Box */}
            <div className="my-3.5 p-3.5 rounded-2xl bg-blue-50/60 dark:bg-slate-900/60 border border-blue-200/60 dark:border-blue-500/20 text-xs text-foreground/90 leading-relaxed shadow-inner">
              <div className="font-semibold text-primary text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1">
                <span>Đoạn văn bản AI đang sinh:</span>
              </div>
              <p className="text-[11.5px] leading-relaxed">
                Bên A cam kết hoàn tất bàn giao các hạng mục trước ngày{" "}
                <span className="inline-block px-1.5 py-0.2 mx-0.5 font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded text-[10.5px]">
                  [NGÀY_BÀN_GIAO]
                </span>
                . Tổng giá trị đợt 1 là{" "}
                <span className="inline-block px-1.5 py-0.2 mx-0.5 font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded text-[10.5px]">
                  [SỐ_TIỀN]
                </span>{" "}
                theo đúng cam kết tại phụ lục.
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary align-middle animate-pulse rounded-xs shadow-xs" />
              </p>
            </div>

            {/* 3 Core Feature Pills */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-xs hover:scale-[1.01] transition-transform">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Sinh văn bản tức thì từ ý tưởng:</span>{" "}
                  <span className="text-muted-foreground text-[11px]">Gõ vài từ khóa thô, AI tạo văn bản hoàn chỉnh.</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-xs hover:scale-[1.01] transition-transform">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Chống ảo giác số liệu &amp; BYOK:</span>{" "}
                  <span className="text-muted-foreground text-[11px]">Bảo vệ số liệu thực tế, bảo mật tuyệt đối.</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/60 dark:border-white/10 shadow-xs hover:scale-[1.01] transition-transform">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Luồng trình ký &amp; So sánh phiên bản:</span>{" "}
                  <span className="text-muted-foreground text-[11px]">Duyệt nhiều cấp, so sánh diff trực quan.</span>
                </div>
              </div>
            </div>

            {/* Productivity Metric Banner */}
            <div className="mt-3.5 pt-3 border-t border-border/50 flex items-center justify-center text-xs">
              <div className="flex items-center gap-1.5 text-primary font-semibold">
                <span>⚡ Tiết kiệm 85% thời gian soạn thảo văn bản</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-3">
          <div>&copy; 2026 DocDraft AI. Mọi quyền được bảo lưu.</div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            <span>Chuẩn hóa thể thức công vụ &amp; doanh nghiệp</span>
          </div>
        </div>
      </div>

      {/* Right Column: Authentication Form with Suspense */}
      <div className="flex w-full items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
        <React.Suspense
          fallback={
            <div className="flex w-full items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <LoginForm />
        </React.Suspense>
      </div>
    </div>
  );
}
