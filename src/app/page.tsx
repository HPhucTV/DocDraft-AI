import Link from "next/link";
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
  ExternalLink,
  Layers,
  BarChart3,
  QrCode,
  Laptop,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02] focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-foreground">
                DOCDRAFT <span className="text-primary">AI</span>
              </span>
              <span className="ml-2.5 hidden sm:inline-flex rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Nghị định 30/2020
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/editor" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                <span>Soạn thảo A4</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/templates" className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span>Kho mẫu biểu</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/word-addin" className="flex items-center gap-1.5">
                <Laptop className="h-4 w-4 text-sky-500" />
                <span>Word Add-in</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/analytics" className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                <span>Thống kê</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings" className="flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <span>BYOK Key</span>
              </Link>
            </Button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Button size="sm" asChild className="gap-1.5 shadow-md shadow-primary/20 font-medium">
              <Link href="/editor">
                <span>Bắt đầu ngay</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24 lg:py-28">
          {/* Subtle Background Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -z-10 -translate-x-1/2 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          >
            <div
              style={{
                clipPath:
                  "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
              }}
              className="relative aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-cyan-400 opacity-20 sm:w-[72.1875rem]"
            />
          </div>

          <div className="container mx-auto px-4 text-center sm:px-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 backdrop-blur-sm px-4 py-1.5 text-sm text-muted-foreground shadow-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span>Thế hệ AI chuyên sâu văn bản hành chính công vụ Việt Nam</span>
            </div>

            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
              Soạn thảo văn bản hành chính chuẩn xác{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent">
                Nghị định 30/2020/NĐ-CP
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Kết hợp sức mạnh trí tuệ nhân tạo DeepSeek-V3 &amp; Gemini 3.7 Flash Fallback,
              cơ chế RAG Pháp luật Việt Nam, bảo mật BYOK AES-256 và phòng chống ảo giác nghiêm ngặt.
            </p>

            {/* Interactive Primary CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                asChild
                className="h-12 px-8 text-base shadow-xl shadow-primary/25 gap-2.5 font-semibold hover:scale-[1.02] transition-transform"
              >
                <Link href="/editor">
                  <FileText className="h-5 w-5" />
                  <span>Tạo dự thảo văn bản</span>
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-7 text-base gap-2.5 font-medium hover:bg-muted/80 hover:scale-[1.02] transition-transform"
              >
                <Link href="/settings">
                  <KeyRound className="h-5 w-5 text-amber-500" />
                  <span>Cấu hình BYOK Key</span>
                </Link>
              </Button>

              <Button
                size="lg"
                variant="ghost"
                asChild
                className="h-12 px-6 text-base gap-2 font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
              >
                <Link href="/admin/templates">
                  <Layers className="h-5 w-5 text-indigo-500" />
                  <span>Khám phá 26 Mẫu chuẩn</span>
                </Link>
              </Button>
            </div>

            {/* Core Invariants Interactive Cards */}
            <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 text-left max-w-6xl mx-auto">
              <Link
                href="/editor"
                className="group rounded-2xl border bg-card/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg hover:border-primary/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Scale className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    Bảng 2 cột vô hình NĐ 30
                  </h3>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Phần đầu &amp; phần kết thúc văn bản được khóa cấu trúc bảng ẩn 2 cột, không bao giờ bị lệch khi xuất Word.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-medium text-primary">
                  Mở Trình Soạn Thảo &rarr;
                </span>
              </Link>

              <Link
                href="/editor"
                className="group rounded-2xl border bg-card/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Chống ảo giác số liệu
                  </h3>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Cơ chế placeholder <code>[...]</code> bắt buộc chuyên viên điền số liệu thực tế, cấm AI tự bịa thông tin nhạy cảm.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  Trải nghiệm kiểm tra Linter &rarr;
                </span>
              </Link>

              <Link
                href="/settings"
                className="group rounded-2xl border bg-card/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Bảo mật tuyệt đối BYOK
                  </h3>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-600" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Mã hóa AES-256-GCM tại client và lưu trữ IndexedDB, không lưu API Key trên máy chủ trung gian.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">
                  Thiết lập API Key cá nhân &rarr;
                </span>
              </Link>

              <Link
                href="/admin/templates"
                className="group rounded-2xl border bg-card/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Cpu className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    DeepSeek + Gemini 3.7
                  </h3>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-600" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Điều phối kép: DeepSeek-V3 văn phong hành chính, Gemini 3.7 Flash tự động dự phòng khi nghẽn mạng.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-medium text-purple-600 dark:text-purple-400">
                  Xem 26 Biểu mẫu chuyên sâu &rarr;
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Specs Section */}
        <section id="standards" className="border-t bg-muted/25 py-20">
          <div className="container mx-auto px-4 sm:px-8 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Hệ thống đồng bộ Tiptap WYSIWYG &amp; OpenXML Word
              </h2>
              <p className="mt-3.5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Đảm bảo những gì soạn trên trình duyệt sẽ khớp 100% khi in ấn hoặc xuất tệp .docx chuẩn công vụ.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Căn lề tiêu chuẩn khổ A4</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Lề trên/dưới 20-25mm, lề trái 30-35mm, lề phải 15-20mm theo đúng Phụ lục I NĐ 30.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Quy chuẩn phông chữ Times New Roman</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Kiểm soát cỡ chữ, in đậm, in nghiêng từng trường thông tin (Quốc hiệu, Tiêu ngữ, Tên cơ quan, Trích yếu).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-sm">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">Bộ quy tắc Linter kiểm tra thể thức</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tự động quét và cảnh báo lỗi thể thức theo thời gian thực trước khi ban hành hoặc ký số.
                    </p>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="pt-2 flex flex-wrap gap-3">
                  <Button asChild size="default" className="gap-2">
                    <Link href="/editor">
                      <FileText className="h-4 w-4" />
                      <span>Mở Trình Soạn Thảo</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="default" className="gap-2">
                    <Link href="/word-addin">
                      <Laptop className="h-4 w-4" />
                      <span>Xem Word Add-in</span>
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="default" className="gap-2 text-muted-foreground">
                    <Link href="/verify/DEMO-QR-2026">
                      <QrCode className="h-4 w-4" />
                      <span>Cổng xác thực QR</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* System Architecture Card */}
              <div className="rounded-2xl border bg-card p-6 shadow-md">
                <div className="flex items-center justify-between border-b pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-sm tracking-tight">Kiến trúc Hệ thống Hoạt động</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    100% Sẵn sàng
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Frontend Framework:</span>
                    <span className="font-medium text-foreground">Next.js 16 (App Router)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Document Microservice:</span>
                    <span className="font-medium text-foreground">Python FastAPI (:8000)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Cơ sở dữ liệu Vector:</span>
                    <span className="font-medium text-foreground">PostgreSQL 18 + PgVector</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">Kho Biểu mẫu Nạp sẵn:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">26 Mẫu / 9 Ngành nghề</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-muted">
                    <span className="text-muted-foreground">AI Orchestration:</span>
                    <span className="font-medium text-foreground">DeepSeek-V3 &amp; Gemini 3.7</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Security Mode:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">BYOK Client-Side AES-256</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Báo cáo &amp; Phân tích</span>
                  <Link
                    href="/admin/analytics"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Xem Dashboard Quản Trị</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10 text-sm text-muted-foreground bg-muted/10">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                D
              </div>
              <span className="font-semibold text-foreground">DOCDRAFT AI</span>
              <span className="text-xs">
                &copy; 2026 — Soạn thảo văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <Link href="/editor" className="hover:text-foreground transition-colors">
                Soạn thảo
              </Link>
              <Link href="/admin/templates" className="hover:text-foreground transition-colors">
                Kho mẫu biểu
              </Link>
              <Link href="/admin/analytics" className="hover:text-foreground transition-colors">
                Thống kê
              </Link>
              <Link href="/settings" className="hover:text-foreground transition-colors">
                Cấu hình BYOK
              </Link>
              <Link href="/word-addin" className="hover:text-foreground transition-colors">
                Word Add-in
              </Link>
              <Link href="/verify/DEMO-QR-2026" className="hover:text-foreground transition-colors">
                Xác thực QR
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
