import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  // RBAC: Chỉ tài khoản có vai trò ADMIN mới được phép truy cập phân hệ Quản trị /admin/*
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard?notice=admin_only");
  }

  return <>{children}</>;
}
