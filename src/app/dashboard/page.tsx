import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { prisma } from "@/lib/prisma";
import {
  FileText,
  KeyRound,
  ShieldCheck,
  LogOut,
  FolderKanban,
  Sparkles,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";

interface DashboardPageProps {
  searchParams?: Promise<{ notice?: string; error?: string }>;
}

export default async function DashboardPage(props: DashboardPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { user } = session;
  const searchParams = props.searchParams ? await props.searchParams : undefined;

  // Lấy chỉ số thực tế từ cơ sở dữ liệu
  const [totalDrafts, totalFolders] = await Promise.all([
    prisma.documentDraft.count({
      where: { userId: user.id, deletedAt: null },
    }),
    prisma.folder.count({
      where: { userId: user.id },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-lg">
              DOCDRAFT <span className="text-primary">AI</span>
            </span>
          </Link>
          <span className="hidden text-xs rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary sm:inline-block">
            Bảng điều khiển công tác
          </span>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <ThemeToggle />
          <div className="flex items-center gap-2 pl-2 border-l">
            <div className="flex flex-col text-right text-xs">
              <span className="font-medium text-foreground">{user.name}</span>
              <span className="text-muted-foreground">{user.jobTitle || user.role}</span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="ghost" size="icon" title="Đăng xuất" type="submit">
                <LogOut className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 container mx-auto max-w-6xl p-6 md:p-8 space-y-8">
        {/* Notice cảnh báo phân quyền nếu cán bộ thường cố truy cập /admin */}
        {searchParams?.notice === "admin_only" && (
          <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Bạn đang đăng nhập với vai trò <strong>{user.role}</strong>. Phân hệ <strong>Quản trị Cấp cao (Admin Hub)</strong> chỉ dành riêng cho Quản trị viên hệ thống.
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
              Quyền hạn chế
            </span>
          </div>
        )}

        {/* User Welcome Banner */}
        <div className="rounded-2xl border bg-gradient-to-r from-blue-900/10 via-primary/5 to-transparent p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Vai trò: {user.role}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Xin chào, {user.name}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {user.organization || "Cơ quan hành chính nhà nước"} &bull; {user.email}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button asChild className="gap-2 shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold">
                <Link href="/templates">
                  <Sparkles className="h-4 w-4" />
                  <span>Thư viện mẫu chuẩn</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2 text-xs font-semibold">
                <Link href="/analytics">
                  <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Năng suất & Thống kê</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2 text-xs font-semibold">
                <Link href="/settings/byok">
                  <KeyRound className="h-4 w-4" />
                  <span>Cấu hình BYOK</span>
                </Link>
              </Button>
              {user.role === "ADMIN" && (
                <Button variant="outline" asChild className="gap-2 text-xs font-semibold border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                  <Link href="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Admin Hub</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Văn bản đang soạn</span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-2xl font-bold">{totalDrafts}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalDrafts > 0 ? "Đang quản lý trên hệ thống" : "Chưa có bản nháp nào"}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Điểm chuẩn thể thức</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
            <p className="mt-1 text-xs text-muted-foreground">Tuân thủ Nghị định 30/2020</p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Thư mục hồ sơ</span>
              <FolderKanban className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-3 text-2xl font-bold">{totalFolders}</div>
            <p className="mt-1 text-xs text-muted-foreground">Hồ sơ lưu trữ phân loại</p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Chế độ AI Gateway</span>
              <KeyRound className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">BYOK</div>
            <p className="mt-1 text-xs text-muted-foreground">DocDraft Dual-Core AI</p>
          </div>
        </div>

        {/* Interactive Workspace (Grid/List View, Tabs, Search, Actions) */}
        <DashboardWorkspace />
      </main>
    </div>
  );
}

