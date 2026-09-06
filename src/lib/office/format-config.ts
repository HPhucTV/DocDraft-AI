/**
 * CẤU HÌNH THỂ THỨC VĂN BẢN DOCDRAFT AI (TASK-FORMAT-CONFIG)
 * Hỗ trợ các bộ Preset chuẩn (Nghị định 30, Doanh nghiệp SME, Trường học)
 * và cho phép người dùng tùy biến linh hoạt theo quy chuẩn riêng của từng đơn vị.
 */

export type FormatPresetId = "nd30" | "corporate" | "school" | "custom";
export type SupportedFontFamily = "Times New Roman" | "Arial" | "Calibri" | "Segoe UI";

export interface MarginsConfig {
  top: number; // milimet (mm)
  bottom: number;
  left: number;
  right: number;
}

export interface DocDraftFormatConfig {
  preset: FormatPresetId;
  name: string;
  fontFamily: SupportedFontFamily;
  fontSize: number; // 11, 12, 13, 14 pt
  lineSpacing: number; // 1.0, 1.15, 1.2, 1.5 multiple
  spaceAfter: number; // 0, 2, 3, 4, 6 pt
  alignment: "Justified" | "Left";
  indentFirstLine: boolean; // Thụt đầu dòng 1.27cm (0.5 inch)
  margins: MarginsConfig;
  autoInsertToWord: boolean; // Tự động ghi thẳng vào Word ngay khi AI sinh xong
}

export const FORMAT_PRESETS: Record<FormatPresetId, DocDraftFormatConfig> = {
  nd30: {
    preset: "nd30",
    name: "Nghị định 30 (Cơ quan Nhà nước)",
    fontFamily: "Times New Roman",
    fontSize: 13,
    lineSpacing: 1.2,
    spaceAfter: 4,
    alignment: "Justified",
    indentFirstLine: true,
    margins: { top: 20, bottom: 20, left: 30, right: 15 },
    autoInsertToWord: true,
  },
  corporate: {
    preset: "corporate",
    name: "Doanh nghiệp / Thương mại (SME)",
    fontFamily: "Arial",
    fontSize: 12,
    lineSpacing: 1.15,
    spaceAfter: 3,
    alignment: "Left",
    indentFirstLine: false,
    margins: { top: 25, bottom: 25, left: 25, right: 25 },
    autoInsertToWord: true,
  },
  school: {
    preset: "school",
    name: "Trường học / Thông báo Nội bộ",
    fontFamily: "Calibri",
    fontSize: 12,
    lineSpacing: 1.0,
    spaceAfter: 2,
    alignment: "Justified",
    indentFirstLine: false,
    margins: { top: 20, bottom: 20, left: 20, right: 15 },
    autoInsertToWord: true,
  },
  custom: {
    preset: "custom",
    name: "Tùy chỉnh cá nhân",
    fontFamily: "Times New Roman",
    fontSize: 13,
    lineSpacing: 1.15,
    spaceAfter: 3,
    alignment: "Justified",
    indentFirstLine: false,
    margins: { top: 20, bottom: 20, left: 25, right: 20 },
    autoInsertToWord: true,
  },
};

const STORAGE_KEY = "docdraft_format_config";
const CUSTOM_PROFILES_KEY = "docdraft_custom_profiles";

/**
 * Đọc cấu hình thể thức từ localStorage, fallback sang Preset mặc định
 */
export function getStoredFormatConfig(): DocDraftFormatConfig {
  if (typeof window === "undefined") {
    return FORMAT_PRESETS.nd30;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...(FORMAT_PRESETS[parsed.preset as FormatPresetId] || FORMAT_PRESETS.nd30),
        ...parsed,
      };
    }
  } catch (err) {
    console.warn("Lỗi đọc cấu hình thể thức từ localStorage:", err);
  }
  return FORMAT_PRESETS.nd30;
}

/**
 * Lưu cấu hình thể thức vào localStorage
 */
export function saveStoredFormatConfig(config: DocDraftFormatConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn("Lỗi lưu cấu hình thể thức vào localStorage:", err);
  }
}

/**
 * Lấy danh sách hồ sơ thể thức tùy chỉnh người dùng đã lưu
 */
export function getStoredCustomProfiles(): DocDraftFormatConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_PROFILES_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("Lỗi đọc danh sách hồ sơ tùy chỉnh:", err);
  }
  return [];
}

/**
 * Lưu một hồ sơ thể thức tùy chỉnh mới
 */
export function saveCustomProfile(profile: DocDraftFormatConfig): DocDraftFormatConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getStoredCustomProfiles().filter((p) => p.name !== profile.name);
    list.push(profile);
    localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(list));
    return list;
  } catch (err) {
    console.warn("Lỗi lưu hồ sơ tùy chỉnh:", err);
    return [];
  }
}

/**
 * Xóa một hồ sơ thể thức tùy chỉnh
 */
export function deleteCustomProfile(profileName: string): DocDraftFormatConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getStoredCustomProfiles().filter((p) => p.name !== profileName);
    localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(list));
    return list;
  } catch (err) {
    console.warn("Lỗi xóa hồ sơ tùy chỉnh:", err);
    return [];
  }
}
