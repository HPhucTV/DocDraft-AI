import React from "react";
import {
  Download,
  Trash2,
  Plus,
  Check,
  RotateCcw,
  SlidersHorizontal,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DocDraftFormatConfig,
  FormatPresetId,
  FORMAT_PRESETS,
  SupportedFontFamily,
} from "@/lib/office/format-config";

interface WordAddinSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: "format" | "byok";
  setActiveSection: (section: "format" | "byok") => void;
  formatConfig: DocDraftFormatConfig;
  customProfiles: DocDraftFormatConfig[];
  newProfileName: string;
  setNewProfileName: (name: string) => void;
  userByokKey: string;
  setUserByokKey: (key: string) => void;
  isLoading: boolean;
  onSelectPreset: (presetId: FormatPresetId) => void;
  onSelectCustomProfile: (profile: DocDraftFormatConfig) => void;
  onSaveNewProfile: () => void;
  onDeleteCustomProfile: (name: string) => void;
  onUpdateFormatConfig: (updates: Partial<DocDraftFormatConfig>) => void;
  onApplyMarginsOnly: () => void;
  onSaveByokKey: () => void;
  onClearByokKey: () => void;
}

export function WordAddinSettingsDrawer({
  isOpen,
  activeSection,
  setActiveSection,
  formatConfig,
  customProfiles,
  newProfileName,
  setNewProfileName,
  userByokKey,
  setUserByokKey,
  isLoading,
  onSelectPreset,
  onSelectCustomProfile,
  onSaveNewProfile,
  onDeleteCustomProfile,
  onUpdateFormatConfig,
  onApplyMarginsOnly,
  onSaveByokKey,
  onClearByokKey,
}: WordAddinSettingsDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Drawer Section Nav */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveSection("format")}
          className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeSection === "format"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>Thể thức & Phông chữ</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("byok")}
          className={`flex-1 py-1 px-2 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeSection === "byok"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <KeyRound className="w-3 h-3" />
          <span>Khóa API (BYOK)</span>
        </button>
      </div>

      {/* SECTION: FORMAT CONFIG */}
      {activeSection === "format" && (
        <div className="p-3 space-y-3 max-h-[380px] overflow-y-auto text-[11px]">
          {/* Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Mẫu thể thức có sẵn:
              </span>
              <button
                type="button"
                onClick={() => onSelectPreset("nd30")}
                className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5"
                title="Khôi phục chuẩn Nghị định 30/2020"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>NĐ 30 gốc</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(FORMAT_PRESETS) as FormatPresetId[]).map((pid) => {
                const preset = FORMAT_PRESETS[pid];
                const isCurrent = formatConfig.preset === pid;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => onSelectPreset(pid)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>{preset.name}</span>
                      {isCurrent && <Check className="w-3 h-3 text-indigo-600" />}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                      {preset.fontFamily}, {preset.fontSize}pt, {preset.lineSpacing}x
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Profiles */}
          {customProfiles.length > 0 && (
            <div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Hồ sơ đã lưu của bạn:
              </span>
              <div className="space-y-1">
                {customProfiles.map((prof) => (
                  <div
                    key={prof.name}
                    className="flex items-center justify-between p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[10px]"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectCustomProfile(prof)}
                      className="font-medium text-left hover:text-indigo-600 flex-1 truncate"
                    >
                      {prof.name} ({prof.fontFamily}, {prof.fontSize}pt)
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCustomProfile(prof.name)}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Profile Form */}
          <div className="flex items-center gap-1 pt-1">
            <input
              type="text"
              placeholder="Tên hồ sơ mới..."
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              className="flex-1 text-[10px] px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 outline-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveNewProfile}
              disabled={!newProfileName.trim()}
              className="h-6 text-[10px] px-2 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Lưu</span>
            </Button>
          </div>

          {/* Font & Spacing Details */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Phông chữ:</label>
              <select
                value={formatConfig.fontFamily}
                onChange={(e) =>
                  onUpdateFormatConfig({ fontFamily: e.target.value as SupportedFontFamily })
                }
                className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
              >
                <option value="Times New Roman">Times New Roman (Chuẩn)</option>
                <option value="Arial">Arial (Không chân)</option>
                <option value="Calibri">Calibri (Hiện đại)</option>
                <option value="Segoe UI">Segoe UI (Thanh lịch)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Cỡ chữ nội dung:</label>
              <select
                value={formatConfig.fontSize}
                onChange={(e) => onUpdateFormatConfig({ fontSize: Number(e.target.value) })}
                className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
              >
                <option value={12}>12 pt</option>
                <option value={13}>13 pt</option>
                <option value={14}>14 pt (Chuẩn NĐ 30)</option>
                <option value={15}>15 pt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Khoảng cách dòng:</label>
              <select
                value={formatConfig.lineSpacing}
                onChange={(e) => onUpdateFormatConfig({ lineSpacing: Number(e.target.value) })}
                className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
              >
                <option value={1.0}>1.0 (Single)</option>
                <option value={1.15}>1.15</option>
                <option value={1.3}>1.3</option>
                <option value={1.35}>1.35 (Chuẩn NĐ 30)</option>
                <option value={1.5}>1.5</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Cách đoạn dưới:</label>
              <select
                value={formatConfig.spaceAfter}
                onChange={(e) => onUpdateFormatConfig({ spaceAfter: Number(e.target.value) })}
                className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
              >
                <option value={0}>0 pt (Sát dòng)</option>
                <option value={2}>2 pt</option>
                <option value={3}>3 pt</option>
                <option value={4}>4 pt</option>
                <option value={6}>6 pt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <div>
              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Căn lề đoạn:</label>
              <select
                value={formatConfig.alignment}
                onChange={(e) =>
                  onUpdateFormatConfig({ alignment: e.target.value as "Justified" | "Left" })
                }
                className="w-full text-[11px] p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none"
              >
                <option value="Justified">Justified (Đều 2 bên)</option>
                <option value="Left">Left (Căn trái)</option>
              </select>
            </div>
            <label className="flex items-center gap-1.5 text-[11px] pt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formatConfig.indentFirstLine}
                onChange={(e) => onUpdateFormatConfig({ indentFirstLine: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Thụt đầu dòng (1.27cm)</span>
            </label>
          </div>

          {/* Margins */}
          <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-600 dark:border-slate-800">
                Căn lề trang Word (mm):
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onApplyMarginsOnly}
                disabled={isLoading}
                className="h-6 text-[9px] px-2"
                title="Áp dụng lề trang vào văn bản Word"
              >
                Đặt lề trang Word
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <div>
                <span className="text-[9px] text-slate-400 block">Trên</span>
                <input
                  type="number"
                  value={formatConfig.margins.top}
                  onChange={(e) =>
                    onUpdateFormatConfig({
                      margins: { ...formatConfig.margins, top: Number(e.target.value) },
                    })
                  }
                  className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Dưới</span>
                <input
                  type="number"
                  value={formatConfig.margins.bottom}
                  onChange={(e) =>
                    onUpdateFormatConfig({
                      margins: { ...formatConfig.margins, bottom: Number(e.target.value) },
                    })
                  }
                  className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Trái</span>
                <input
                  type="number"
                  value={formatConfig.margins.left}
                  onChange={(e) =>
                    onUpdateFormatConfig({
                      margins: { ...formatConfig.margins, left: Number(e.target.value) },
                    })
                  }
                  className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Phải</span>
                <input
                  type="number"
                  value={formatConfig.margins.right}
                  onChange={(e) =>
                    onUpdateFormatConfig({
                      margins: { ...formatConfig.margins, right: Number(e.target.value) },
                    })
                  }
                  className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: BYOK API KEY */}
      {activeSection === "byok" && (
        <div className="p-3 space-y-2.5 text-[11px] bg-white dark:bg-slate-900">
          <p className="text-[10px] text-slate-500">
            Nhập khóa DeepSeek (sk-...) hoặc Gemini (AIza...) của bạn để sử dụng trực tiếp không giới hạn lượt gọi:
          </p>
          <div className="space-y-1.5">
            <input
              type="password"
              placeholder="Dán API Key (sk-... hoặc AIza...)"
              value={userByokKey}
              onChange={(e) => setUserByokKey(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[9px] text-slate-400">
                {userByokKey ? "Đang dùng Key cá nhân" : "Đang dùng Key hệ thống mặc định"}
              </span>
              <div className="flex gap-1.5">
                {userByokKey && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClearByokKey}
                    className="h-7 text-[10px] px-2 text-rose-600 hover:text-rose-700"
                  >
                    Xóa
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={onSaveByokKey}
                  className="h-7 text-[10px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Lưu khóa
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
            <a
              href="/word-addin/manifest.xml"
              download="manifest.xml"
              className="text-[9px] text-indigo-500 hover:underline inline-flex items-center gap-1"
            >
              <Download className="w-2.5 h-2.5" />
              <span>Tải tệp manifest.xml cài đặt Add-in</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
