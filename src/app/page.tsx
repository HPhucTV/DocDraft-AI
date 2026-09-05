import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Scale,
  KeyRound,
  CheckCircle2,
  Cpu,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                DOCDRAFT <span className="text-primary">AI</span>
              </span>
              <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Nghị định 30/2020
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="#features">Tính năng</a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="#standards">Chuẩn thể thức</a>
            </Button>
            <ThemeToggle />
            <Button size="sm" className="gap-1.5 shadow">
              <span>Bắt đầu ngay</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="container mx-auto px-4 text-center sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground shadow-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Thế hệ AI chuyên sâu văn bản hành chính công vụ Việt Nam</span>
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Soạn thảo văn bản hành chính chuẩn xác{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Nghị định 30/2020/NĐ-CP
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Kết hợp sức mạnh trí tuệ nhân tạo DeepSeek-V3 &amp; Gemini 3.7 Flash Fallback,
              cơ chế RAG Pháp luật Việt Nam, bảo mật BYOK AES-256 và chống ảo giác nghiêm ngặt.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg gap-2">
                <FileText className="h-5 w-5" />
                <span>Tạo dự thảo văn bản</span>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base gap-2">
                <KeyRound className="h-5 w-5" />
                <span>Cấu hình BYOK Key</span>
              </Button>
            </div>

            {/* Core Invariants Badge Cards */}
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 text-left max-w-5xl mx-auto">
              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-card-foreground">Bảng 2 cột vô hình NĐ 30</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Phần đầu &amp; phần kết thúc văn bản được khóa cấu trúc bảng ẩn 2 cột, không bao giờ bị lệch khi xuất Word.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-card-foreground">Phòng chống ảo giác số liệu</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cơ chế đặt cọc giữ chỗ <code>[...]</code> bắt buộc chuyên viên điền số liệu thực tế, cấm AI tự bịa thông tin nhạy cảm.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-card-foreground">Bảo mật tuyệt đối BYOK</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Mã hóa AES-256-GCM tại client và lưu trữ IndexedDB, không lưu API Key trên máy chủ trung gian.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-4">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-card-foreground">DeepSeek + Gemini 3.7</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Điều phối kép thông minh: DeepSeek-V3 xử lý văn phong hành chính, Gemini 3.7 Flash tự động dự phòng khi nghẽn mạng.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Specs */}
        <section id="standards" className="border-t bg-muted/30 py-16">
          <div className="container mx-auto px-4 sm:px-8 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight">Hệ thống đồng bộ Tiptap WYSIWYG &amp; OpenXML Word</h2>
              <p className="mt-3 text-muted-foreground">
                Đảm bảo những gì soạn trên trình duyệt sẽ khớp 100% khi in ấn hoặc xuất tệp .docx chuẩn công vụ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Căn lề tiêu chuẩn khổ A4</h4>
                    <p className="text-sm text-muted-foreground">
                      Lề trên/dưới 20-25mm, lề trái 30-35mm, lề phải 15-20mm theo đúng Phụ lục I NĐ 30.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Quy chuẩn phông chữ Time New Roman</h4>
                    <p className="text-sm text-muted-foreground">
                      Kiểm soát cỡ chữ, in đậm, in nghiêng từng trường thông tin (Quốc hiệu, Tiêu ngữ, Tên cơ quan, Trích yếu).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Bộ quy tắc Linter kiểm tra thể thức</h4>
                    <p className="text-sm text-muted-foreground">
                      Tự động quét và cảnh báo lỗi thể thức theo thời gian thực trước khi ban hành hoặc ký số.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <span className="font-semibold text-sm">Trạng thái hệ thống (Sprint 1)</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sẵn sàng
                  </span>
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-muted">
                    <span className="text-muted-foreground">Frontend Framework:</span>
                    <span className="font-medium">Next.js 16 (App Router)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <span className="text-muted-foreground">Design System:</span>
                    <span className="font-medium">Tailwind CSS + Shadcn UI</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <span className="text-muted-foreground">State Management:</span>
                    <span className="font-medium">Zustand Store</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-muted">
                    <span className="text-muted-foreground">AI Orchestration:</span>
                    <span className="font-medium">DeepSeek-V3 &amp; Gemini 3.7</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Security Mode:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">BYOK Client-Side AES-256</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>
            &copy; 2026 DOCDRAFT AI — Hệ thống soạn thảo văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP.
          </p>
        </div>
      </footer>
    </div>
  );
}
