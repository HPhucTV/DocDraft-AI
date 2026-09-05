"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FileText,
  ShieldCheck,
  Building,
  User,
  Mail,
  Lock,
  BadgeCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          organization,
          jobTitle,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Đăng ký không thành công");
      } else {
        setSuccessMessage("Đăng ký tài khoản thành công! Đang chuyển hướng...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch {
      setErrorMessage("Không thể kết nối đến máy chủ xác thực");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 md:grid md:grid-cols-2 lg:px-0">
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
              &ldquo;Đăng ký tài khoản chuyên viên để bắt đầu xây dựng hồ sơ văn bản pháp quy, khai thác thư viện biểu mẫu công vụ và trải nghiệm tính năng kiểm tra thể thức tự động.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">
              Bảo mật danh tính &amp; chủ quyền dữ liệu theo NĐ 13/2023/NĐ-CP
            </footer>
          </blockquote>

          <div className="space-y-3 pt-4 border-t border-zinc-800 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              <span>Hỗ trợ định dạng chuẩn Times New Roman khổ A4</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Mật khẩu được mã hóa an toàn bằng thuật toán bcrypt</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
          &copy; 2026 DocDraft AI. All rights reserved.
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="flex w-full flex-col justify-center px-4 sm:w-[460px] md:px-6">
        <div className="flex flex-col space-y-2 text-center mb-6">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-2 md:hidden">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tạo tài khoản cán bộ</h1>
          <p className="text-sm text-muted-foreground">
            Tham gia hệ thống quản lý và soạn thảo văn bản thông minh
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="fullName">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Họ và tên cán bộ <span className="text-destructive">*</span></span>
            </label>
            <Input
              id="fullName"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="email">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Địa chỉ Email công vụ <span className="text-destructive">*</span></span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="ten.canbo@coquan.gov.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="organization">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Cơ quan / Đơn vị</span>
              </label>
              <Input
                id="organization"
                placeholder="UBND Quận..."
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="jobTitle">
                <BadgeCheck className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Chức vụ</span>
              </label>
              <Input
                id="jobTitle"
                placeholder="Chuyên viên..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5" htmlFor="password">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Mật khẩu bảo mật <span className="text-destructive">*</span></span>
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-semibold shadow-md mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xử lý đăng ký...</span>
              </div>
            ) : (
              <span>Đăng ký tài khoản</span>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Đã có tài khoản chuyên viên?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
