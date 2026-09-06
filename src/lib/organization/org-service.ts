/**
 * ==============================================================================
 * DỊCH VỤ QUẢN TRỊ TỔ CHỨC ĐA NGƯỜI THUÊ (MULTI-TENANT ORGANIZATION SERVICE)
 * TASK-504 — Tham chiếu kiến trúc: docs/adr/ADR-006-auth-and-rbac.md
 * ==============================================================================
 */

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headName?: string;
  memberCount: number;
}

export interface OrgMember {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "APPROVER" | "USER" | "VIEWER";
  departmentId: string;
  departmentName?: string;
  jobTitle: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  joinedAt: string;
}

export interface InternalTemplate {
  id: string;
  title: string;
  category: string;
  departmentId?: string;
  departmentName?: string;
  usageCount: number;
  lastUpdated: string;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  code: string;
  superiorAgency: string; // Cơ quan cấp trên (VD: UBND Tỉnh / Tập đoàn)
  issuingAgency: string;  // Cơ quan ban hành trực tiếp (VD: Sở Kế hoạch & Đầu tư)
  taxCode: string;
  address: string;
  contactEmail: string;
  phone: string;
  tier: "ENTERPRISE" | "GOVERNMENT" | "STANDARD";
  sealConfigured: boolean;
  departments: Department[];
  members: OrgMember[];
  internalTemplates: InternalTemplate[];
}

// In-memory persistent state cho Organization (có fallback dữ liệu mẫu thực tế chuẩn thể thức Việt Nam)
let defaultOrganization: OrganizationProfile = {
  id: "org-docdraft-corp",
  name: "Tổng Công ty Phát triển Công nghệ DocDraft Việt Nam",
  code: "DOCDRAFT-VN",
  superiorAgency: "BỘ KHOA HỌC VÀ CÔNG NGHỆ",
  issuingAgency: "TỔNG CÔNG TY CÔNG NGHỆ DOCDRAFT",
  taxCode: "0109887766",
  address: "Tòa nhà Innovation Hub, Số 18 Đường Phạm Hùng, Cầu Giấy, Hà Nội",
  contactEmail: "vanthu@docdraft.vn",
  phone: "(024) 3888 9999",
  tier: "ENTERPRISE",
  sealConfigured: true,
  departments: [
    {
      id: "dept-bod",
      name: "Ban Tổng Giám đốc",
      code: "BOD",
      description: "Lãnh đạo cấp cao phê duyệt và ký ban hành văn bản quy phạm",
      headName: "Nguyễn Văn Lãnh Đạo",
      memberCount: 2,
    },
    {
      id: "dept-legal",
      name: "Phòng Pháp chế & Thể thức",
      code: "LEGAL",
      description: "Thẩm tra tính hợp hiến, hợp pháp và rà soát chuẩn Nghị định 30",
      headName: "Trần Thị Pháp Chế",
      memberCount: 4,
    },
    {
      id: "dept-admin",
      name: "Phòng Hành chính - Quản trị",
      code: "ADMIN",
      description: "Quản lý văn thư, cấp số ký hiệu, đóng dấu và lưu trữ hồ sơ",
      headName: "Lê Văn Hành Chính",
      memberCount: 5,
    },
    {
      id: "dept-finance",
      name: "Phòng Kế hoạch - Tài chính",
      code: "FINANCE",
      description: "Soạn thảo tờ trình dự toán, quyết toán kinh phí và hợp đồng thương mại",
      headName: "Phạm Thị Kế Toán",
      memberCount: 6,
    },
    {
      id: "dept-tech",
      name: "Ban Công nghệ & Chuyển đổi số",
      code: "TECH",
      description: "Vận hành hệ thống soạn thảo AI và an toàn thông tin số",
      headName: "Vũ Hoàng Công Nghệ",
      memberCount: 8,
    },
  ],
  members: [
    {
      id: "mem-01",
      fullName: "Nguyễn Văn Lãnh Đạo",
      email: "lanhdao@docdraft.vn",
      role: "APPROVER",
      departmentId: "dept-bod",
      departmentName: "Ban Tổng Giám đốc",
      jobTitle: "Tổng Giám đốc",
      status: "ACTIVE",
      joinedAt: "2026-01-15",
    },
    {
      id: "mem-02",
      fullName: "Trần Quản Trị Viên",
      email: "admin@docdraft.vn",
      role: "ADMIN",
      departmentId: "dept-admin",
      departmentName: "Phòng Hành chính - Quản trị",
      jobTitle: "Trưởng phòng Hành chính / Quản trị hệ thống",
      status: "ACTIVE",
      joinedAt: "2026-01-10",
    },
    {
      id: "mem-03",
      fullName: "Lê Thị Chuyên Viên",
      email: "chuyenvien@docdraft.vn",
      role: "USER",
      departmentId: "dept-legal",
      departmentName: "Phòng Pháp chế & Thể thức",
      jobTitle: "Chuyên viên Thẩm định Pháp lý",
      status: "ACTIVE",
      joinedAt: "2026-02-01",
    },
    {
      id: "mem-04",
      fullName: "Phạm Khách Xem",
      email: "khach@docdraft.vn",
      role: "VIEWER",
      departmentId: "dept-finance",
      departmentName: "Phòng Kế hoạch - Tài chính",
      jobTitle: "Thực tập sinh Nghiên cứu",
      status: "ACTIVE",
      joinedAt: "2026-03-01",
    },
  ],
  internalTemplates: [
    {
      id: "tmpl-org-01",
      title: "Quy định Quản lý Văn bản và Điều hành Nội bộ",
      category: "Quy chế nội bộ",
      departmentId: "dept-admin",
      departmentName: "Phòng Hành chính - Quản trị",
      usageCount: 42,
      lastUpdated: "2026-08-20",
    },
    {
      id: "tmpl-org-02",
      title: "Tờ trình Phê duyệt Kế hoạch Mua sắm Tài sản Công nghệ",
      category: "Tờ trình",
      departmentId: "dept-tech",
      departmentName: "Ban Công nghệ & Chuyển đổi số",
      usageCount: 28,
      lastUpdated: "2026-08-28",
    },
    {
      id: "tmpl-org-03",
      title: "Biên bản Họp Giao ban Định kỳ Ban Lãnh đạo",
      category: "Biên bản",
      departmentId: "dept-bod",
      departmentName: "Ban Tổng Giám đốc",
      usageCount: 65,
      lastUpdated: "2026-09-01",
    },
  ],
};

/**
 * Lấy toàn bộ thông tin tổ chức
 */
export function getOrganization(): OrganizationProfile {
  return defaultOrganization;
}

/**
 * Cập nhật hồ sơ pháp nhân cơ quan
 */
export function updateOrganizationProfile(
  updates: Partial<Omit<OrganizationProfile, "departments" | "members" | "internalTemplates">>
): OrganizationProfile {
  defaultOrganization = {
    ...defaultOrganization,
    ...updates,
  };
  return defaultOrganization;
}

/**
 * Thêm phòng ban mới
 */
export function addDepartment(dept: {
  name: string;
  code: string;
  description?: string;
  headName?: string;
}): Department {
  const newDept: Department = {
    id: `dept-${Date.now()}`,
    name: dept.name,
    code: dept.code.toUpperCase(),
    description: dept.description,
    headName: dept.headName || "Chưa bổ nhiệm",
    memberCount: 0,
  };
  defaultOrganization.departments.push(newDept);
  return newDept;
}

/**
 * Xóa phòng ban
 */
export function deleteDepartment(departmentId: string): boolean {
  const initialLength = defaultOrganization.departments.length;
  defaultOrganization.departments = defaultOrganization.departments.filter(
    (d) => d.id !== departmentId
  );
  return defaultOrganization.departments.length < initialLength;
}

/**
 * Mời hoặc thêm cán bộ mới vào tổ chức
 */
export function addMember(member: {
  fullName: string;
  email: string;
  role: "ADMIN" | "APPROVER" | "USER" | "VIEWER";
  departmentId: string;
  jobTitle?: string;
}): OrgMember {
  const dept = defaultOrganization.departments.find((d) => d.id === member.departmentId);
  const newMember: OrgMember = {
    id: `mem-${Date.now()}`,
    fullName: member.fullName,
    email: member.email,
    role: member.role,
    departmentId: member.departmentId,
    departmentName: dept?.name || "Chưa phân bổ",
    jobTitle: member.jobTitle || "Cán bộ chuyên trách",
    status: "ACTIVE",
    joinedAt: new Date().toISOString().split("T")[0],
  };

  defaultOrganization.members.push(newMember);

  // Tăng đếm thành viên phòng ban
  if (dept) {
    dept.memberCount += 1;
  }

  return newMember;
}

/**
 * Cập nhật vai trò RBAC hoặc phòng ban của cán bộ
 */
export function updateMember(
  memberId: string,
  updates: Partial<Pick<OrgMember, "role" | "departmentId" | "jobTitle" | "status">>
): OrgMember | null {
  const mem = defaultOrganization.members.find((m) => m.id === memberId);
  if (!mem) return null;

  if (updates.role) mem.role = updates.role;
  if (updates.jobTitle) mem.jobTitle = updates.jobTitle;
  if (updates.status) mem.status = updates.status;

  if (updates.departmentId && updates.departmentId !== mem.departmentId) {
    // Giảm đếm phòng ban cũ
    const oldDept = defaultOrganization.departments.find((d) => d.id === mem.departmentId);
    if (oldDept && oldDept.memberCount > 0) oldDept.memberCount -= 1;

    // Tăng đếm phòng ban mới
    const newDept = defaultOrganization.departments.find((d) => d.id === updates.departmentId);
    if (newDept) newDept.memberCount += 1;

    mem.departmentId = updates.departmentId;
    mem.departmentName = newDept?.name || "Chưa phân bổ";
  }

  return mem;
}

/**
 * Xóa cán bộ khỏi tổ chức
 */
export function removeMember(memberId: string): boolean {
  const mem = defaultOrganization.members.find((m) => m.id === memberId);
  if (!mem) return false;

  const dept = defaultOrganization.departments.find((d) => d.id === mem.departmentId);
  if (dept && dept.memberCount > 0) {
    dept.memberCount -= 1;
  }

  defaultOrganization.members = defaultOrganization.members.filter((m) => m.id !== memberId);
  return true;
}
