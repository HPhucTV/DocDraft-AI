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
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
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
        setErrorMessage("Email hoặc mật khẩu không chính xác");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage("Đã xảy ra sự cố kết nối tới hệ thống máy chủ");
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
      setErrorMessage("Không thể kết nối với dịch vụ Google OAuth");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col justify-center px-4 sm:w-[420px] md:px-6">
      <div className="flex flex-col space-y-2 text-center mb-6">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2 md:hidden">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Đăng nhập tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Truy cập không gian làm việc văn bản hành chính công vụ
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 text-sm font-medium shadow-sm"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
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
        <span>Tiếp tục với Google</span>
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Hoặc đăng nhập với Email
          </span>
        </div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Địa chỉ Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="ten.canbo@coquan.gov.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading || isGoogleLoading}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">
              Mật khẩu
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading || isGoogleLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold shadow-md"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xác thực...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Đăng nhập</span>
            </div>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Chưa có tài khoản chuyên viên?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 md:grid md:grid-cols-2 lg:px-0">
      {/* Top right theme toggle */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <ThemeToggle />
      </div>

      {/* Left Column: Brand Hero Banner */}
      <div className="relative hidden h-full flex-col justify-between bg-zinc-900 p-10 text-white dark:border-r md:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-zinc-900 to-black" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-white">
              DOCDRAFT <span className="text-blue-400">AI</span>
            </span>
            <div className="text-xs text-zinc-400">
              Chuẩn Nghị định 30/2020/NĐ-CP
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed text-zinc-200">
              &ldquo;Nền tảng ứng dụng AI chuyên sâu đầu tiên tại Việt Nam giải quyết triệt để bài toán chuẩn hóa thể thức văn bản công vụ, loại bỏ nguy cơ lệch bố cục và phòng ngừa ảo giác số liệu.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">
              Kiến trúc song mã DeepSeek-V3 &amp; Gemini 3.7 Flash
            </footer>
          </blockquote>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-400" />
              <span>Bảng ẩn 2 cột chuẩn NĐ 30</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Bảo mật BYOK AES-256</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
          &copy; 2026 DocDraft AI. Bảo mật và tuân thủ Nghị định 13/2023/NĐ-CP.
        </div>
      </div>

      {/* Right Column: Authentication Form with Suspense */}
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
  );
}
