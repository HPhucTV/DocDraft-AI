import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FileText,
  PlusCircle,
  KeyRound,
  ShieldCheck,
  LogOut,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

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
        {/* User Welcome Banner */}
        <div className="rounded-2xl border bg-gradient-to-r from-blue-900/10 via-primary/5 to-transparent p-6 sm:p-8 shadow-sm">
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

            <div className="flex items-center gap-3">
              <Button asChild className="gap-2 shadow">
                <Link href="/templates/demo">
                  <Sparkles className="h-4 w-4" />
                  <span>Biểu mẫu động (Form Engine)</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link href="/settings/byok">
                  <KeyRound className="h-4 w-4" />
                  <span>Cấu hình BYOK</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Văn bản đã tạo</span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 text-2xl font-bold">0</div>
            <p className="mt-1 text-xs text-muted-foreground">Chưa có bản nháp nào</p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Điểm chuẩn thể thức</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
            <p className="mt-1 text-xs text-muted-foreground">Tuân thủ Nghị định 30/2020</p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Thư mục hồ sơ</span>
              <FolderKanban className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-3 text-2xl font-bold">0</div>
            <p className="mt-1 text-xs text-muted-foreground">0 hồ sơ lưu trữ</p>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Chế độ AI Gateway</span>
              <KeyRound className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">BYOK</div>
            <p className="mt-1 text-xs text-muted-foreground">DeepSeek-V3 + Gemini 3.7</p>
          </div>
        </div>

        {/* Empty state list */}
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">Chưa có văn bản dự thảo nào</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Bắt đầu tạo văn bản mới từ thư viện biểu mẫu chuẩn (Quyết định, Công văn, Tờ trình, Thông báo...)
          </p>
          <div className="mt-6">
            <Button asChild className="gap-2">
              <Link href="/editor/new">
                <PlusCircle className="h-4 w-4" />
                <span>Tạo dự thảo đầu tiên</span>
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
