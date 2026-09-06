"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Layers,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Mail,
  UserCheck,
  Shield,
  Clock,
  Sparkles,
  Save,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type {
  OrganizationProfile,
  Department,
  OrgMember,
} from "@/lib/organization/org-service";

export default function OrganizationAdminPage() {
  const [org, setOrg] = useState<OrganizationProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "departments" | "members" | "templates">("members");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Modal states
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  // Form states for Add Dept
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptHead, setNewDeptHead] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");

  // Form states for Add Member
  const [newMemName, setNewMemName] = useState("");
  const [newMemEmail, setNewMemEmail] = useState("");
  const [newMemRole, setNewMemRole] = useState<"ADMIN" | "APPROVER" | "USER" | "VIEWER">("USER");
  const [newMemDept, setNewMemDept] = useState("");
  const [newMemTitle, setNewMemTitle] = useState("");

  // Form states for Profile edit
  const [profileForm, setProfileForm] = useState({
    name: "",
    superiorAgency: "",
    issuingAgency: "",
    taxCode: "",
    address: "",
    contactEmail: "",
    phone: "",
  });

  const loadData = async () => {
    try {
      const res = await fetch("/api/organization");
      if (res.ok) {
        const data: OrganizationProfile = await res.json();
        setOrg(data);
        setProfileForm({
          name: data.name,
          superiorAgency: data.superiorAgency,
          issuingAgency: data.issuingAgency,
          taxCode: data.taxCode,
          address: data.address,
          contactEmail: data.contactEmail,
          phone: data.phone,
        });
        if (data.departments.length > 0 && !newMemDept) {
          setNewMemDept(data.departments[0].id);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/organization", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "Đã lưu thay đổi hồ sơ cơ quan thành công!" });
        loadData();
      } else {
        throw new Error("Lỗi khi lưu");
      }
    } catch {
      setStatusMessage({ type: "error", text: "Không thể lưu hồ sơ. Vui lòng thử lại." });
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptCode.trim()) return;

    try {
      const res = await fetch("/api/organization/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDeptName,
          code: newDeptCode,
          headName: newDeptHead,
          description: newDeptDesc,
        }),
      });

      if (res.ok) {
        setStatusMessage({ type: "success", text: `Đã thêm phòng ban "${newDeptName}" thành công!` });
        setIsAddDeptOpen(false);
        setNewDeptName("");
        setNewDeptCode("");
        setNewDeptHead("");
        setNewDeptDesc("");
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: "error", text: err.error || "Không thể thêm phòng ban." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Lỗi kết nối máy chủ khi thêm phòng ban." });
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phòng ban "${name}"?`)) return;

    try {
      const res = await fetch(`/api/organization/departments?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatusMessage({ type: "success", text: `Đã xóa phòng ban "${name}".` });
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: "error", text: err.error || "Không thể xóa phòng ban." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Lỗi kết nối khi xóa phòng ban." });
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName.trim() || !newMemEmail.trim() || !newMemDept) return;

    try {
      const res = await fetch("/api/organization/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newMemName,
          email: newMemEmail,
          role: newMemRole,
          departmentId: newMemDept,
          jobTitle: newMemTitle,
        }),
      });

      if (res.ok) {
        setStatusMessage({ type: "success", text: `Đã mời cán bộ "${newMemName}" thành công!` });
        setIsAddMemberOpen(false);
        setNewMemName("");
        setNewMemEmail("");
        setNewMemTitle("");
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: "error", text: err.error || "Không thể thêm cán bộ." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Lỗi kết nối khi thêm cán bộ." });
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa cán bộ "${name}" khỏi tổ chức?`)) return;

    try {
      const res = await fetch(`/api/organization/members?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatusMessage({ type: "success", text: `Đã xóa cán bộ "${name}".` });
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: "error", text: err.error || "Không thể xóa cán bộ." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Lỗi kết nối khi xóa cán bộ." });
    }
  };

  const handleChangeRole = async (memberId: string, role: string) => {
    try {
      const res = await fetch("/api/organization/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role }),
      });
      if (res.ok) {
        setStatusMessage({ type: "success", text: "Đã cập nhật vai trò cán bộ thành công!" });
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: "error", text: err.error || "Không thể cập nhật vai trò." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Lỗi kết nối khi đổi vai trò." });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <Shield className="w-3 h-3" /> Quản trị viên
          </span>
        );
      case "APPROVER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <UserCheck className="w-3 h-3" /> Lãnh đạo duyệt
          </span>
        );
      case "USER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Briefcase className="w-3 h-3" /> Chuyên viên
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            Khách xem
          </span>
        );
    }
  };

  // Lọc danh sách nhân sự
  const filteredMembers = (org?.members || []).filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === "ALL" || m.departmentId === selectedDeptFilter;
    const matchesRole = selectedRoleFilter === "ALL" || m.role === selectedRoleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Quay lại Tổng quan"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight flex items-center gap-2">
                  Quản trị Tổ chức Đa người thuê
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Enterprise
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  {org?.name || "Đang tải dữ liệu đơn vị..."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <Link href="/editor">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shadow-xs">
                <FileText className="w-3.5 h-3.5" />
                Vào Soạn thảo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* STATUS ALERT */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl flex items-center justify-between text-xs font-medium border animate-in fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* OVERVIEW STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Tổng số cán bộ</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black mt-2">{org?.members.length || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Hoạt động trong 5 phòng ban</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Phòng ban trực thuộc</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black mt-2">{org?.departments.length || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Cơ cấu tổ chức chuyên trách</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Mẫu lưu hành nội bộ</span>
              <FileText className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black mt-2">{org?.internalTemplates.length || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Chỉ sử dụng trong đơn vị</p>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Con dấu & Chữ ký số</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black mt-2 text-emerald-600">Đã kích hoạt</div>
            <p className="text-[11px] text-slate-500 mt-1">Chuẩn xác thực Nghị định 30</p>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-sm font-semibold">
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "members"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            👥 Danh bạ Cán bộ & Phân quyền ({org?.members.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "departments"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            🏢 Phòng ban trực thuộc ({org?.departments.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            🏛️ Hồ sơ Pháp nhân & Tiêu ngữ
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "templates"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            📄 Mẫu Lưu hành Nội bộ ({org?.internalTemplates.length || 0})
          </button>
        </div>

        {/* TAB CONTENT 1: MEMBERS */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, chức vụ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-hidden"
                >
                  <option value="ALL">Tất cả phòng ban</option>
                  {org?.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-hidden"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="ADMIN">Quản trị viên</option>
                  <option value="APPROVER">Lãnh đạo duyệt</option>
                  <option value="USER">Chuyên viên</option>
                  <option value="VIEWER">Khách xem</option>
                </select>
              </div>

              <Button
                onClick={() => setIsAddMemberOpen(true)}
                className="w-full sm:w-auto text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Mời Cán bộ Mới
              </Button>
            </div>

            {/* MEMBERS TABLE */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Họ và tên & Email</th>
                      <th className="p-3.5">Phòng ban</th>
                      <th className="p-3.5">Chức vụ</th>
                      <th className="p-3.5">Vai trò RBAC</th>
                      <th className="p-3.5">Trạng thái</th>
                      <th className="p-3.5 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMembers.map((mem) => (
                      <tr key={mem.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{mem.fullName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {mem.email}
                          </div>
                        </td>
                        <td className="p-3.5 font-medium">{mem.departmentName}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400">{mem.jobTitle}</td>
                        <td className="p-3.5">
                          <select
                            value={mem.role}
                            onChange={(e) => handleChangeRole(mem.id, e.target.value)}
                            className="text-xs p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
                          >
                            <option value="ADMIN">Quản trị viên (ADMIN)</option>
                            <option value="APPROVER">Lãnh đạo duyệt (APPROVER)</option>
                            <option value="USER">Chuyên viên (USER)</option>
                            <option value="VIEWER">Khách xem (VIEWER)</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Hoạt động
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteMember(mem.id, mem.fullName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Xóa cán bộ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: DEPARTMENTS */}
        {activeTab === "departments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Quản lý sơ đồ phòng ban phục vụ quy trình phân bổ văn bản và luồng trình ký nội bộ.
              </p>
              <Button
                onClick={() => setIsAddDeptOpen(true)}
                className="text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm Phòng ban
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {org?.departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {dept.code}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1.5">
                        {dept.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDeleteDept(dept.id, dept.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-opacity"
                      title="Xóa phòng ban"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {dept.description || "Chưa có mô tả chức năng nhiệm vụ."}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span>Trưởng phòng: <strong>{dept.headName}</strong></span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {dept.memberCount} cán bộ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB CONTENT 3: PROFILE */}
        {activeTab === "profile" && (
          <div className="max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Thông tin Pháp nhân Cơ quan & Tiêu ngữ Chuẩn NĐ 30
            </h2>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cơ quan cấp trên trực tiếp:
                  </label>
                  <input
                    type="text"
                    value={profileForm.superiorAgency}
                    onChange={(e) => setProfileForm({ ...profileForm, superiorAgency: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    placeholder="VD: BỘ KHOA HỌC VÀ CÔNG NGHỆ"
                  />
                  <p className="text-[10px] text-slate-400">Hiển thị ở dòng 1 bên trái khối Quốc hiệu</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tên cơ quan ban hành văn bản:
                  </label>
                  <input
                    type="text"
                    value={profileForm.issuingAgency}
                    onChange={(e) => setProfileForm({ ...profileForm, issuingAgency: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    placeholder="VD: TỔNG CÔNG TY CÔNG NGHỆ DOCDRAFT"
                  />
                  <p className="text-[10px] text-slate-400">Hiển thị in hoa đậm ở dòng 2</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tên đầy đủ của cơ quan / doanh nghiệp:
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mã số thuế / Mã định danh cơ quan:
                  </label>
                  <input
                    type="text"
                    value={profileForm.taxCode}
                    onChange={(e) => setProfileForm({ ...profileForm, taxCode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Số điện thoại liên hệ văn thư:
                  </label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Địa chỉ trụ sở chính:
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="text-xs font-semibold gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs">
                  <Save className="w-3.5 h-3.5" />
                  Lưu Thay Đổi Hồ Sơ
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB CONTENT 4: TEMPLATES */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Các mẫu văn bản hành chính lưu hành nội bộ riêng cho đơn vị của bạn.
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Tên mẫu văn bản nội bộ</th>
                    <th className="p-3.5">Phân loại</th>
                    <th className="p-3.5">Phòng ban phụ trách</th>
                    <th className="p-3.5">Lượt sử dụng</th>
                    <th className="p-3.5">Cập nhật lần cuối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {org?.internalTemplates.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        {t.title}
                      </td>
                      <td className="p-3.5 font-medium">{t.category}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{t.departmentName}</td>
                      <td className="p-3.5 font-bold text-indigo-600">{t.usageCount} lượt</td>
                      <td className="p-3.5 text-slate-500">{t.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL THÊM PHÒNG BAN */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Thêm Phòng ban mới</h3>
              <button onClick={() => setIsAddDeptOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Tên phòng ban:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng Truyền thông & Thương hiệu"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Mã viết tắt:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: PR"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Trưởng phòng:</label>
                <input
                  type="text"
                  placeholder="VD: Hoàng Văn A"
                  value={newDeptHead}
                  onChange={(e) => setNewDeptHead(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Mô tả chức năng nhiệm vụ:</label>
                <textarea
                  rows={2}
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-hidden resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddDeptOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Tạo phòng ban
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MỜI CÁN BỘ MỚI */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Mời Cán bộ mới vào Tổ chức</h3>
              <button onClick={() => setIsAddMemberOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Họ và tên cán bộ:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn B"
                  value={newMemName}
                  onChange={(e) => setNewMemName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Email công vụ:</label>
                <input
                  type="email"
                  required
                  placeholder="VD: canbo@docdraft.vn"
                  value={newMemEmail}
                  onChange={(e) => setNewMemEmail(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phòng ban trực thuộc:</label>
                <select
                  value={newMemDept}
                  onChange={(e) => setNewMemDept(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-hidden"
                >
                  {org?.departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Chức danh / Vị trí:</label>
                <input
                  type="text"
                  placeholder="VD: Chuyên viên Pháp chế"
                  value={newMemTitle}
                  onChange={(e) => setNewMemTitle(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phân quyền vai trò RBAC:</label>
                <select
                  value={newMemRole}
                  onChange={(e) => setNewMemRole(e.target.value as "ADMIN" | "APPROVER" | "USER" | "VIEWER")}
                  className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-hidden font-semibold"
                >
                  <option value="USER">Chuyên viên (USER) - Soạn thảo & gọi AI</option>
                  <option value="APPROVER">Lãnh đạo duyệt (APPROVER) - Phê duyệt & Ký số</option>
                  <option value="ADMIN">Quản trị viên (ADMIN) - Toàn quyền cơ quan</option>
                  <option value="VIEWER">Khách xem (VIEWER) - Chỉ đọc qua link</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddMemberOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Mời cán bộ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
