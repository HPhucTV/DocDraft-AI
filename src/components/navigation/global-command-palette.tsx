"use client";

import React, { useState, useEffect } from "react";
import { CommandPalette } from "./command-palette";
import { ShortcutsDialog } from "@/components/ui/shortcuts-dialog";

export function GlobalCommandPalette() {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      // 1. Phím tắt Ctrl+K hoặc Cmd+K mở Command Palette ở bất kỳ đâu
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
        return;
      }

      // 2. Phím ? mở Bảng tra cứu phím tắt (chỉ khi không đang gõ text trong input)
      if (e.key === "?" && !isEditing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleCommand = (e: Event) => {
      const detail = (e as CustomEvent<{ action: string }>).detail;
      if (detail?.action === "shortcuts") {
        setIsShortcutsOpen(true);
      }
    };
    window.addEventListener("docdraft:command", handleCommand);
    return () => window.removeEventListener("docdraft:command", handleCommand);
  }, []);

  return (
    <>
      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />
      <ShortcutsDialog
        open={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
      />
    </>
  );
}
