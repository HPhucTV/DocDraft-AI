"use client";

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
  ArrowRight,
  Layers,
  BarChart3,
  Laptop,
  Zap,
  Lock,
  GitCompare,
  Bot,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Header Navigation - Executive Dark seamlessly blending with Hero */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-xl text-white transition-all">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-[1.02] focus:outline-none"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 text-white shadow-md shadow-blue-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex items-center">
              <span className="text-xl font-bold tracking-tight text-white">
                DOCDRAFT <span className="text-blue-400 font-black">AI</span>
              </span>
              <span className="ml-2.5 hidden sm:inline-flex rounded-full bg-blue-500/20 border border-blue-400/30 px-2.5 py-0.5 text-xs font-semibold text-blue-300">
                AI Soạn thảo v2.0
              </span>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white hover:bg-slate-800/60">
              <Link href="/editor" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-400" />
                <span>Soạn thảo A4</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white hover:bg-slate-800/60">
              <Link href="/templates" className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-indigo-400" />
                <span>Kho mẫu biểu</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white hover:bg-slate-800/60">
              <Link href="/word-addin" className="flex items-center gap-1.5">
                <Laptop className="h-4 w-4 text-sky-400" />
                <span>Word Add-in</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white hover:bg-slate-800/60">
              <Link href="/analytics" className="flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                <span>Thống kê</span>
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="text-slate-300 hover:text-white hover:bg-slate-800/60">
              <Link href="/settings" className="flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-amber-400" />
                <span>Bảo mật BYOK</span>
              </Link>
            </Button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-9 w-9 border border-slate-700/80 bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors" />
            <Button variant="ghost" size="sm" asChild className="font-medium text-slate-300 hover:text-white hover:bg-slate-800/60">
              <Link href="/login">Đăng nhập</Link>
            </Button>
            <Button size="sm" asChild className="gap-1.5 shadow-lg shadow-blue-500/25 font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
              <Link href="/editor">
                <span>Soạn thảo ngay</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Section 1: Executive Split-Hero (Deep Navy #0B0F19) */}
        <section className="relative overflow-hidden bg-[#0B0F19] text-white pt-10 pb-16 md:pt-16 md:pb-24 border-b border-slate-800/80">
          {/* Ambient Lighting & Technical Grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/4 -z-0 transform-gpu overflow-hidden blur-3xl opacity-30"
          >
            <div className="aspect-[1000/600] w-[60rem] bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 right-0 -z-0 transform-gpu overflow-hidden blur-3xl opacity-20"
          >
            <div className="aspect-[800/500] w-[45rem] bg-gradient-to-br from-indigo-500 to-blue-700" />
          </div>

          <div className="container mx-auto px-4 sm:px-8 max-w-7xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left Column: Headline, Value Proposition & Actions */}
              <div className="lg:col-span-6 space-y-6 text-left">
                {/* Pill Tag */}
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 backdrop-blur-md px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-blue-300 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Nền tảng Trợ lý AI Soạn thảo Thế hệ mới</span>
                </div>

                {/* Main Headline - Balanced & Powerful */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                  Soạn thảo Văn bản Chuẩn mực trong 3 Giây{" "}
                  <span className="block mt-1 bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
                    với Trợ lý Trí tuệ Nhân tạo
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                  Tự động chuyển hóa ghi chú thô, dàn ý cuộc họp thành tờ trình, hợp đồng, quyết định và công văn chuyên nghiệp.
                  Tích hợp cơ chế <strong className="text-white">chống ảo giác số liệu [...]</strong> đột phá, luồng trình ký duyệt đa cấp và tự động căn chuẩn thể thức văn bản hành chính công vụ.
                </p>

                {/* Primary Action CTAs */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Button
                    size="lg"
                    asChild
                    className="h-12 px-7 text-sm sm:text-base shadow-xl shadow-blue-500/25 gap-2.5 font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl hover:scale-[1.02] transition-transform"
                  >
                    <Link href="/editor">
                      <Zap className="h-4 w-4" />
                      <span>Trải nghiệm Soạn thảo AI</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="h-12 px-6 text-sm sm:text-base gap-2.5 font-medium border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl hover:scale-[1.02] transition-transform"
                  >
                    <Link href="/login">
                      <Bot className="h-4 w-4 text-blue-400" />
                      <span>Đăng nhập hệ thống</span>
                    </Link>
                  </Button>
                </div>

                {/* Quick Trust Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 text-xs text-slate-300 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Chuẩn thể thức NĐ 30</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Chống ảo giác [...]</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Trình ký duyệt 3 cấp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <span>Mã hóa AES-256</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Document Drafting Mockup (High Contrast A4 Paper inside Slate Card) */}
              <div className="lg:col-span-6 relative">
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-blue-500/30 via-cyan-400/20 to-indigo-500/30 blur-xl -z-10 opacity-70" />

                <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-xl overflow-hidden">
                  {/* Window Title Bar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                        <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                        <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="ml-2 font-mono text-slate-400 hidden sm:inline-block">
                        Dự_thảo_Tờ_trình_chủ_trương_đầu_tư_2026.docx
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 text-blue-300 px-2.5 py-0.5 text-[11px] font-semibold border border-blue-400/30">
                        <Sparkles className="h-3 w-3" />
                        <span>AI: Hoàn tất 3.2s</span>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-400/30">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Chống ảo giác</span>
                      </span>
                    </div>
                  </div>

                  {/* Simulated AI Prompt Box */}
                  <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-xs text-slate-300 truncate">
                      <span className="text-slate-400">Yêu cầu: </span>
                      <span className="italic font-medium text-slate-200">
                        &ldquo;Soạn tờ trình xin chủ trương nâng cấp hạ tầng số 2026, ngân sách 15.8 tỷ...&rdquo;
                      </span>
                    </div>
                  </div>

                  {/* Document Drafting Preview Content (Realistic Crisp White Paper for High Contrast) */}
                  <div 
                    className="p-6 sm:p-7 bg-white text-slate-900 space-y-3.5 shadow-inner"
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  >
                    {/* Two-Column Official Header */}
                    <div className="grid grid-cols-2 gap-3 text-center text-xs pb-3 border-b border-slate-200">
                      <div>
                        <p className="font-bold text-slate-600 text-[11px]">ỦY BAN NHÂN DÂN THÀNH PHỐ</p>
                        <p className="font-bold text-slate-900 text-xs">SỞ THÔNG TIN VÀ TRUYỀN THÔNG</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Số: [SỐ/KÝ HIỆU]/TTr-STTTT</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-[11px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="font-semibold text-slate-900 text-[11px] underline underline-offset-4">Độc lập - Tự do - Hạnh phúc</p>
                        <p className="text-[10px] italic text-slate-500 mt-0.5">[Địa danh], ngày [NGÀY] tháng [THÁNG] năm 2026</p>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center pt-1">
                      <h3 className="text-base sm:text-lg font-bold tracking-wide text-slate-900">TỜ TRÌNH</h3>
                      <p className="text-xs font-semibold italic mt-0.5 text-slate-600">
                        Về việc phê duyệt chủ trương nâng cấp hạ tầng số và an toàn thông tin năm 2026
                      </p>
                    </div>

                    {/* Body Paragraph with Interactive Highlights */}
                    <div className="text-xs leading-relaxed space-y-2 text-slate-800">
                      <p>
                        <strong>Kính gửi:</strong>{" "}
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-100 border border-amber-300 text-amber-900 font-sans font-semibold text-[11px]">
                          [ỦY BAN NHÂN DÂN THÀNH PHỐ]
                        </span>
                      </p>
                      <p>
                        Căn cứ định hướng phát triển chuyển đổi số quốc gia giai đoạn 2026 - 2030, Sở Thông tin và Truyền thông kính trình Ủy ban nhân dân Thành phố xem xét, phê duyệt chủ trương với các nội dung trọng tâm:
                      </p>
                      <p>
                        1. <strong>Mục tiêu:</strong> Hiện đại hóa trung tâm dữ liệu, bảo đảm an toàn thông tin cấp độ 3 theo tiêu chuẩn an ninh mạng quốc gia.
                      </p>
                      <p>
                        2. <strong>Dự toán kinh phí:</strong>{" "}
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-100 border border-amber-300 text-amber-900 font-sans font-semibold text-[11px] animate-pulse">
                          [15.850.000.000 VNĐ]
                        </span>{" "}
                        (nguồn vốn ngân sách sự nghiệp KHCN).
                      </p>
                      <p>
                        3. <strong>Thời gian hoàn thành:</strong> Trước ngày{" "}
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-amber-100 border border-amber-300 text-amber-900 font-sans font-semibold text-[11px]">
                          [30/09/2026]
                        </span>
                        <span className="inline-block w-1 h-3.5 bg-blue-600 align-middle ml-1 animate-pulse" />
                      </p>
                    </div>
                  </div>

                  {/* Bottom Status Bar */}
                  <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-medium text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Chuẩn thể thức NĐ 30
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="hidden sm:inline-block">Căn lề A4: 20-20-30-15mm</span>
                    </div>
                    <Link
                      href="/editor"
                      className="font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                    >
                      <span>Mở trong trình soạn thảo</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Alternating Rhythm - 4 Core Pillars (Crisp Slate/Cloud Background) */}
        <section className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/80 dark:bg-slate-900/60 py-16 sm:py-20 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-8 max-w-6xl">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Năng lực Đột phá
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                4 Trụ cột Cốt lõi của DOCDRAFT AI
              </h2>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Kết hợp tự động hóa văn bản, bảo vệ số liệu nghiêm ngặt và quy trình cộng tác số an toàn.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 text-left">
              {/* Pillar 1: AI Speed */}
              <Link
                href="/editor"
                className="group rounded-2xl border border-white/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-800/90 p-6 shadow-md hover:shadow-xl hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Soạn thảo AI Siêu tốc
                  </h3>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Biến vài dòng ghi chú hoặc dàn ý thành dự thảo hoàn chỉnh trong 3 giây với Trợ lý AI thế hệ mới đa tầng tốc độ cao.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Tạo dự thảo AI ngay &rarr;
                </span>
              </Link>

              {/* Pillar 2: Anti-Hallucination */}
              <Link
                href="/editor"
                className="group rounded-2xl border border-white/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-800/90 p-6 shadow-md hover:shadow-xl hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Chống ảo giác số liệu
                  </h3>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Cơ chế placeholder <code>[...]</code> bắt buộc chuyên viên điền số liệu thực tế, cấm AI tự bịa thông tin tài chính, pháp lý.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Khám phá cơ chế Linter &rarr;
                </span>
              </Link>

              {/* Pillar 3: Workflow Collaboration & Approval */}
              <Link
                href="/editor"
                className="group rounded-2xl border border-white/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-800/90 p-6 shadow-md hover:shadow-xl hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <GitCompare className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Trình ký &amp; So sánh phiên bản
                  </h3>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-purple-600" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Quy trình duyệt 3 cấp (Chuyên viên &rarr; Lãnh đạo &rarr; Ký số) kèm công cụ diff so sánh chính xác từng thay đổi.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400">
                  Xem quy trình phê duyệt &rarr;
                </span>
              </Link>

              {/* Pillar 4: BYOK Security */}
              <Link
                href="/settings"
                className="group rounded-2xl border border-white/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-800/90 p-6 shadow-md hover:shadow-xl hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Bảo mật tuyệt đối BYOK
                  </h3>
                  <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-600" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Mã hóa AES-256-GCM tại máy khách, khóa API cá nhân lưu trữ an toàn trong IndexedDB, không lộ ra bên ngoài.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Cấu hình Key cá nhân &rarr;
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 3: Comprehensive Features (Clean Background) */}
        <section id="features" className="bg-background py-20 border-b">
          <div className="container mx-auto px-4 sm:px-8 max-w-5xl">
            <div className="text-center mb-14">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Tính năng toàn diện
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
                Bộ công cụ từ Soạn thảo đến Ban hành Văn bản
              </h2>
              <p className="mt-3.5 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Đồng bộ 100% giữa trình soạn thảo WYSIWYG trên trình duyệt và tệp tin Microsoft Word OpenXML (.docx).
              </p>
            </div>

            {/* 2x2 Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="flex items-start gap-4 p-5 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-xs hover:shadow-md hover:border-blue-500/30 transition-all">
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5 text-blue-600 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-base">Khổ giấy A4 &amp; Thước kẻ Word Ruler</h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Mô phỏng trải nghiệm Microsoft Word trực quan với thước căn lề thực tế (20-20-30-15mm) và chuyển trang A4 tự động.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-4 p-5 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-xs hover:shadow-md hover:border-emerald-500/30 transition-all">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-base">Bảng ẩn 2 cột chuẩn thể thức</h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Phần đầu (Quốc hiệu, Tiêu ngữ, Tên cơ quan) và phần cuối (Nơi nhận, Người ký) được cố định cấu trúc bảng ẩn, không bao giờ xô lệch khi tải về.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-4 p-5 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-xs hover:shadow-md hover:border-indigo-500/30 transition-all">
                <div className="h-11 w-11 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-base">Kho 26 Mẫu biểu Hành chính &amp; Doanh nghiệp</h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Bao phủ 9 ngành nghề từ quyết định, tờ trình, thông báo, biên bản đến hợp đồng thương mại sẵn sàng khởi tạo trong 1 chạm.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-4 p-5 rounded-2xl border bg-card/80 backdrop-blur-sm shadow-xs hover:border-sky-500/30 transition-all">
                <div className="h-11 w-11 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0 mt-0.5 text-sky-600 dark:text-sky-400">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-base">Word Add-in Tích hợp Máy tính</h4>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Gọi trực tiếp trợ lý DocDraft AI ngay trong ứng dụng Microsoft Word Office 365 trên máy tính để viết tiếp hoặc soát lỗi văn bản.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Action Links */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="default" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
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
            </div>
          </div>
        </section>

        {/* Section 4: Ready to Start CTA (Executive Dark Gradient Banner) */}
        <section className="py-16 sm:py-20 bg-[#0B0F19] text-white relative overflow-hidden border-b border-slate-800/80">
          <div className="container mx-auto px-4 sm:px-8 max-w-4xl relative z-10">
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-tr from-blue-900/40 via-indigo-900/30 to-slate-900/80 backdrop-blur-xl p-8 sm:p-12 text-center shadow-2xl relative">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Sẵn sàng nâng tầm tốc độ soạn thảo văn bản?
              </h3>
              <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                Trải nghiệm ngay trình soạn thảo AI thông minh, loại bỏ rủi ro sai sót số liệu và tiết kiệm đến 85% thời gian làm việc mỗi ngày.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <Button size="lg" asChild className="h-12 px-7 gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25">
                  <Link href="/editor">
                    <Sparkles className="h-4 w-4" />
                    <span>Bắt đầu soạn thảo miễn phí</span>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 px-6 gap-2 font-medium border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl">
                  <Link href="/login">
                    <span>Đăng nhập tài khoản</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Executive Slate #070A10 */}
      <footer className="border-t border-slate-800/80 py-10 text-sm text-slate-400 bg-[#070A10]">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs shadow-sm">
                D
              </div>
              <span className="font-semibold text-white">DOCDRAFT AI</span>
              <span className="text-xs text-slate-400">
                &copy; 2026 — Nền tảng Trí tuệ Nhân tạo Soạn thảo Văn bản Thông minh.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
              <Link href="/editor" className="hover:text-white transition-colors">
                Soạn thảo
              </Link>
              <Link href="/login" className="hover:text-white transition-colors">
                Đăng nhập
              </Link>
              <Link href="/templates" className="hover:text-white transition-colors">
                Kho mẫu biểu
              </Link>
              <Link href="/analytics" className="hover:text-white transition-colors">
                Thống kê
              </Link>
              <Link href="/settings" className="hover:text-white transition-colors">
                Cấu hình BYOK
              </Link>
              <Link href="/word-addin" className="hover:text-white transition-colors">
                Word Add-in
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

