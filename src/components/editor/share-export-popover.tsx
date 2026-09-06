"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Share2,
  Lock,
  Globe,
  Link2,
  Copy,
  Check,
  Download,
  Printer,
  Settings,
  ChevronDown,
  Loader2,
  Sparkles,
  ExternalLink,
  BookmarkPlus,
  History,
  Eye,
  Plus,
  UserCheck,
} from "lucide-react";
import { collabManager, type Collaborator } from "@/lib/collaboration/collab-manager";
import { useNotificationStore } from "@/lib/stores/notification-store";

export interface ShareExportPopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  draftId?: string;
  draftTitle?: string;
  editorContent?: string;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  exportingFormat: "pdf" | "docx" | null;
  onExport: (format: "pdf" | "docx") => Promise<void> | void;
  onCopyHTML: () => void;
  copied: boolean;
  onOpenAdvancedShare?: () => void;
  onOpenHistory?: () => void;
  onSaveAsTemplate?: () => void;
}

export function ShareExportPopover({
  open,
  onOpenChange,
  draftId = "draft-temp",
  draftTitle = "Văn bản dự thảo",
  editorContent,
  currentUser = { id: "user-current", name: "Bạn", email: "user@docdraft.vn", role: "USER" },
  exportingFormat,
  onExport,
  onCopyHTML,
  copied,
  onOpenAdvancedShare,
  onOpenHistory,
  onSaveAsTemplate,
}: ShareExportPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  // State quản lý mời & phân quyền
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedMembers, setInvitedMembers] = useState<string[]>([]);
  const [accessLevel, setAccessLevel] = useState<"RESTRICTED" | "PUBLIC_VIEW" | "PUBLIC_EDIT">("RESTRICTED");
  const [isAccessDropdownOpen, setIsAccessDropdownOpen] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Tự động đóng menu cấp độ khi đóng popover
  useEffect(() => {
    if (!isOpen) {
      setIsAccessDropdownOpen(false);
    }
  }, [isOpen]);

  // Lắng nghe cộng tác viên trực tuyến
  useEffect(() => {
    const unsub = collabManager.subscribe((users) => {
      setCollaborators(users);
    });
    return () => unsub();
  }, []);

  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Xử lý thêm người qua email và gửi email thực tế
  const handleAddMember = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const email = inviteEmail.trim();
    if (!email || isSendingInvite) return;

    setIsSendingInvite(true);
    setInviteFeedback(null);

    try {
      await fetch("/api/email/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          documentTitle: draftTitle,
          draftId: draftId || "draft-temp",
          permission: accessLevel === "PUBLIC_EDIT" ? "EDIT" : "VIEW",
        }),
      });

      if (!invitedMembers.includes(email)) {
        setInvitedMembers((prev) => [...prev, email]);
      }

      // Tạo thông báo vào store
      useNotificationStore.getState().addNotification({
        title: "Đã gửi lời mời cộng tác",
        message: `Bạn đã gửi lời mời tham gia chỉnh sửa văn bản "${draftTitle}" tới ${email}.`,
        category: "INVITE",
        documentTitle: draftTitle,
      });

      setInviteFeedback(`Đã gửi lời mời tới ${email}`);
      setTimeout(() => setInviteFeedback(null), 4000);
      setInviteEmail("");
    } catch (err) {
      console.error("Lỗi khi gửi email:", err);
      setInviteFeedback("Không thể gửi email lúc này");
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Sao chép liên kết chia sẻ (Tương thích API & URL hiện hành)
  const handleCopyShareLink = useCallback(async () => {
    setIsCopyingLink(true);
    let urlToCopy = "";

    try {
      if (draftId && draftId !== "draft-temp") {
        // Thử lấy link chia sẻ bảo mật từ API
        const res = await fetch(`/api/drafts/${draftId}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            permission: accessLevel === "PUBLIC_EDIT" ? "EDIT" : "VIEW",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.shareUrl) {
            urlToCopy = data.shareUrl;
          }
        }
      }
    } catch (err) {
      console.warn("Không thể tạo link qua API, dùng URL trực tiếp:", err);
    }

    if (!urlToCopy) {
      if (typeof window !== "undefined") {
        urlToCopy = draftId && draftId !== "draft-temp"
          ? `${window.location.origin}/editor?draftId=${draftId}`
          : window.location.href;
      }
    }

    if (navigator.clipboard && urlToCopy) {
      await navigator.clipboard.writeText(urlToCopy);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
    setIsCopyingLink(false);
  }, [draftId, accessLevel]);

  // Mở tab xem bản in công khai
  const handlePublicPreview = () => {
    if (typeof window !== "undefined") {
      const viewUrl = draftId && draftId !== "draft-temp"
        ? `/editor?draftId=${draftId}&mode=preview`
        : window.location.href;
      window.open(viewUrl, "_blank");
    }
  };

  const totalOnline = collaborators.length + 1; // +1 cho currentUser

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5 h-8 text-xs font-semibold shadow-xs shrink-0 whitespace-nowrap px-3 bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-600 dark:hover:bg-violet-700 active:scale-95 transition-all"
          title="Chia sẻ tài liệu & Xuất bản"
        >
          <Share2 className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Chia sẻ</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[calc(100vw-24px)] max-w-[380px] sm:w-[380px] p-0 font-sans shadow-2xl border-border/80 bg-background/98 backdrop-blur-md rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 no-print"
      >
        {/* ========================================================================= */}
        {/* 1. HEADER CỦA MENU CHIA SẺ (Phong cách Canva) */}
        {/* ========================================================================= */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground tracking-tight">Chia sẻ thiết kế</h3>
            <span className="text-[11px] font-normal text-muted-foreground truncate max-w-[130px]" title={draftTitle}>
              ({draftTitle})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{totalOnline} trực tuyến</span>
            </div>

            {onOpenAdvancedShare && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAdvancedShare();
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Cài đặt quyền bảo mật nâng cao"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. KHỐI THÀNH VIÊN & PHÂN QUYỀN TRUY CẬP (Chuẩn Hình 1) */}
        {/* ========================================================================= */}
        <div className="p-4 space-y-3.5">
          {/* Label + Input Thêm người */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Thành viên có quyền truy cập
            </label>
            <form onSubmit={handleAddMember} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Input
                  ref={emailInputRef}
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Thêm người qua email..."
                  className="h-9 text-xs pl-8 pr-3 rounded-xl border-border/80 bg-background focus-visible:ring-violet-500"
                />
                <Globe className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!inviteEmail.trim() || isSendingInvite}
                className="h-9 px-2.5 rounded-xl text-xs gap-1 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/40"
              >
                {isSendingInvite ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>{isSendingInvite ? "Đang gửi..." : "Mời"}</span>
              </Button>
            </form>
            {inviteFeedback && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1 animate-in fade-in">
                <Check className="h-3 w-3" />
                <span>{inviteFeedback}</span>
              </p>
            )}
          </div>

          {/* Hàng Avatar Thành viên đã truy cập */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {/* Avatar Tác giả / Current User */}
            <div
              className="h-8 w-8 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-background shrink-0"
              title={`Bạn (${currentUser.name}) - Chủ tài liệu`}
            >
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "B"}
            </div>

            {/* Các cộng tác viên online */}
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="h-8 w-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-background shrink-0"
                style={{ backgroundColor: c.color }}
                title={`${c.name} - Đang cùng soạn thảo`}
              >
                {c.name ? c.name.charAt(0).toUpperCase() : "U"}
              </div>
            ))}

            {/* Các email đã được mời */}
            {invitedMembers.map((email, idx) => (
              <div
                key={idx}
                className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 text-foreground flex items-center justify-center font-semibold text-[10px] shadow-xs ring-2 ring-background shrink-0"
                title={`Đã gửi lời mời: ${email}`}
              >
                {email.charAt(0).toUpperCase()}
              </div>
            ))}

            {/* Nút thêm nhanh */}
            <button
              type="button"
              onClick={() => {
                emailInputRef.current?.focus();
              }}
              className="h-8 w-8 rounded-full border border-dashed border-border/90 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-violet-500 hover:bg-violet-500/10 transition-colors shrink-0"
              title="Thêm cộng tác viên mới"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Cấp độ truy cập */}
          <div className="relative">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Cấp độ truy cập
            </label>
            <button
              type="button"
              onClick={() => setIsAccessDropdownOpen(!isAccessDropdownOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted/40 transition-colors text-left text-xs"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-muted text-foreground">
                  {accessLevel === "RESTRICTED" ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : accessLevel === "PUBLIC_VIEW" ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5 text-violet-600" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {accessLevel === "RESTRICTED"
                      ? "Chỉ người được mời mới có quyền truy cập"
                      : accessLevel === "PUBLIC_VIEW"
                      ? "Bất kỳ ai có liên kết (Chỉ xem)"
                      : "Bất kỳ ai có liên kết (Có thể chỉnh sửa)"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {accessLevel === "RESTRICTED"
                      ? "Chỉ bạn và email được chỉ định"
                      : "Không cần đăng nhập vào hệ thống"}
                  </div>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>

            {/* Menu thả xuống chọn Cấp độ */}
            {isAccessDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsAccessDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 p-1 rounded-xl border border-border/80 bg-background shadow-xl space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setAccessLevel("RESTRICTED");
                    setIsAccessDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-colors ${
                    accessLevel === "RESTRICTED" ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 font-semibold" : "hover:bg-muted"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div>Chỉ người được mời mới có quyền truy cập</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Bảo mật cao nhất</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccessLevel("PUBLIC_VIEW");
                    setIsAccessDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-colors ${
                    accessLevel === "PUBLIC_VIEW" ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 font-semibold" : "hover:bg-muted"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div>Bất kỳ ai có liên kết (Chỉ xem)</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Thích hợp gửi cấp trên duyệt</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccessLevel("PUBLIC_EDIT");
                    setIsAccessDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-colors ${
                    accessLevel === "PUBLIC_EDIT" ? "bg-violet-50 dark:bg-violet-950/40 text-violet-600 font-semibold" : "hover:bg-muted"
                  }`}
                >
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div>Bất kỳ ai có liên kết (Có thể chỉnh sửa)</div>
                    <div className="text-[10px] text-muted-foreground font-normal">Cộng tác trực tuyến thời gian thực</div>
                  </div>
                </button>
              </div>
              </>
            )}
          </div>

          {/* Nút To Màu Tím: Sao chép liên kết (Chuẩn Canva Hình 1) */}
          <button
            type="button"
            onClick={handleCopyShareLink}
            disabled={isCopyingLink}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] ${
              linkCopied
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {isCopyingLink ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : linkCopied ? (
              <Check className="h-4 w-4 text-white" />
            ) : (
              <Link2 className="h-4 w-4 text-white" />
            )}
            <span>{linkCopied ? "Đã sao chép liên kết!" : "Sao chép liên kết"}</span>
          </button>

          {/* Subtext tùy chỉnh */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Tùy chỉnh liên kết của bạn cho phù hợp</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. ĐƯỜNG KẺ PHÂN CÁCH */}
        {/* ========================================================================= */}
        <div className="h-px bg-border/60 mx-4" />

        {/* ========================================================================= */}
        {/* 4. LƯỚI HÀNH ĐỘNG NHANH (GÓI GỌN 3 NÚT HÌNH 2 + TIỆN ÍCH) */}
        {/* ========================================================================= */}
        <div className="p-4 pt-3 space-y-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Thao tác & Xuất bản
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* 1. XUẤT WORD (HÌNH 2) */}
            <button
              type="button"
              onClick={() => {
                onExport("docx");
                setIsOpen(false);
              }}
              disabled={!editorContent || exportingFormat !== null}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/70 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all text-center"
              title="Tải văn bản Word .docx chuẩn Nghị định 30"
            >
              <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                {exportingFormat === "docx" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">Xuất Word</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">.docx NĐ 30</span>
            </button>

            {/* 2. IN / PDF (HÌNH 2) */}
            <button
              type="button"
              onClick={() => {
                onExport("pdf");
                setIsOpen(false);
              }}
              disabled={!editorContent || exportingFormat !== null}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/70 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-center"
              title="In trực tiếp hoặc Xuất file PDF chuẩn A4"
            >
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                {exportingFormat === "pdf" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Printer className="h-5 w-5" />
                )}
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">In / PDF</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Vector A4</span>
            </button>

            {/* 3. SAO CHÉP (HÌNH 2) */}
            <button
              type="button"
              onClick={() => {
                onCopyHTML();
              }}
              disabled={!editorContent}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/70 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-center"
              title="Sao chép toàn bộ nội dung HTML / văn bản"
            >
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                {copied ? (
                  <Check className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">
                {copied ? "Đã chép" : "Sao chép"}
              </span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Mã HTML</span>
            </button>

            {/* 4. XEM CÔNG KHAI */}
            <button
              type="button"
              onClick={() => {
                handlePublicPreview();
                setIsOpen(false);
              }}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/70 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-center"
              title="Mở liên kết xem công khai chế độ đọc sạch"
            >
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <ExternalLink className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">Xem công khai</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Chỉ đọc</span>
            </button>

            {/* 5. LƯU LÀM MẪU */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSaveAsTemplate?.();
              }}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/70 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-center"
              title="Lưu tài liệu hiện tại thành mẫu dùng chung"
            >
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <BookmarkPlus className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">Lưu làm mẫu</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Biểu mẫu</span>
            </button>

            {/* 6. LỊCH SỬ PHIÊN BẢN */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenHistory?.();
              }}
              className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-border/70 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all text-center"
              title="Xem lịch sử thay đổi và phiên bản"
            >
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <History className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">Lịch sử</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">Phiên bản</span>
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
