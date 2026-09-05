"use client";

import React from "react";

interface WordRulerProps {
  zoomLevel?: number;
}

/**
 * Thước đo căn lề A4 chân thực chuẩn Microsoft Word & Nghị định 30/2020/NĐ-CP.
 * - Khổ giấy rộng 210mm (21cm)
 * - Lề trái: 30mm (3.0cm)
 * - Thụt đầu dòng đoạn văn: 12mm (1.2cm, tính từ lề trái là 4.2cm)
 * - Vùng văn bản: 165mm
 * - Lề phải: 15mm (1.5cm, từ 19.5cm đến 21.0cm)
 */
export function WordRuler({ zoomLevel = 100 }: WordRulerProps) {
  // Tạo danh sách các vạch cm từ 0 đến 21
  const cmTicks = Array.from({ length: 22 }, (_, i) => i);

  return (
    <div
      style={{
        transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
        transformOrigin: "bottom center",
      }}
      className="w-[210mm] max-w-full h-7 mb-1 bg-slate-200 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-t-sm shadow-xs select-none flex flex-col justify-between overflow-hidden transition-transform duration-150"
      title="Thước đo căn lề khổ A4 chuẩn Nghị định 30/2020/NĐ-CP"
    >
      {/* Thân thước đo gồm 3 dải: Lề trái (3cm) | Vùng in (16.5cm) | Lề phải (1.5cm) */}
      <div className="relative w-full h-full flex items-stretch text-[9px] font-mono">
        {/* Vùng Lề Trái (0 đến 3.0cm - 30mm) */}
        <div
          style={{ width: "calc(30 / 210 * 100%)" }}
          className="h-full bg-slate-300/80 dark:bg-slate-900/90 border-r border-slate-400/60 dark:border-slate-700 relative group cursor-default"
          title="Lề trái: 30mm (Chuẩn Nghị định 30)"
        >
          <span className="absolute bottom-0.5 left-1 text-[8px] text-slate-500 dark:text-slate-400 font-semibold">
            30mm
          </span>
          {/* Con trỏ mốc lề trái */}
          <div className="absolute -bottom-0.5 right-0 translate-x-1/2 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-primary" />
        </div>

        {/* Vùng Soạn thảo Trắng (3.0cm đến 19.5cm) */}
        <div
          style={{ width: "calc(165 / 210 * 100%)" }}
          className="h-full bg-white dark:bg-slate-800 relative flex items-stretch"
        >
          {/* Con trỏ thụt đầu dòng 1.2cm (12mm) tính từ lề trái */}
          <div
            style={{ left: "calc(12 / 165 * 100%)" }}
            className="absolute top-0 -translate-x-1/2 z-10 cursor-default group"
            title="Thụt đầu dòng đoạn văn: 1.2cm (12mm) chuẩn NĐ 30"
          >
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[6px] border-t-amber-500" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border text-[8px] px-1 rounded shadow-xs whitespace-nowrap pointer-events-none">
              Thụt dòng 1.2cm
            </span>
          </div>

          {/* Các vạch chia trên thước (cm) */}
          <div className="absolute inset-0 flex justify-between px-1">
            {cmTicks.slice(3, 20).map((cm) => (
              <div
                key={cm}
                className="relative flex flex-col items-center justify-end pb-0.5"
                style={{ width: "calc(100% / 16)" }}
              >
                <div className="h-2 w-px bg-slate-400 dark:bg-slate-600" />
                <span className="text-[8px] text-slate-500 dark:text-slate-400 leading-none">
                  {cm - 3}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vùng Lề Phải (19.5cm đến 21.0cm - 15mm) */}
        <div
          style={{ width: "calc(15 / 210 * 100%)" }}
          className="h-full bg-slate-300/80 dark:bg-slate-900/90 border-l border-slate-400/60 dark:border-slate-700 relative group cursor-default"
          title="Lề phải: 15mm (Chuẩn Nghị định 30)"
        >
          {/* Con trỏ mốc lề phải */}
          <div className="absolute -bottom-0.5 left-0 -translate-x-1/2 w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-primary" />
          <span className="absolute bottom-0.5 right-1 text-[8px] text-slate-500 dark:text-slate-400 font-semibold">
            15mm
          </span>
        </div>
      </div>
    </div>
  );
}
