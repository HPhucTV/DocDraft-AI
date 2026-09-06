import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkGeneralApiRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local-client";
    const rateLimit = await checkGeneralApiRateLimit(`register:${ip}`);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Bạn đã thao tác đăng ký quá nhiều lần. Vui lòng thử lại sau ít phút." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, fullName, organization, jobTitle } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ Email, Mật khẩu và Họ tên" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có độ dài tối thiểu 6 ký tự" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Địa chỉ email này đã được sử dụng" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName: fullName.trim(),
        organization: organization?.trim() || null,
        jobTitle: jobTitle?.trim() || null,
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organization: true,
        jobTitle: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "Đăng ký tài khoản thành công", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi đăng ký tài khoản:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi máy chủ nội bộ trong quá trình đăng ký" },
      { status: 500 }
    );
  }
}
