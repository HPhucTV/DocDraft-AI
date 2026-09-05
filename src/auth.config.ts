import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 ngày
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.passwordHash) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            image: user.avatarUrl,
            role: user.role,
            organization: user.organization,
            jobTitle: user.jobTitle,
          };
        } catch (error) {
          console.error("Lỗi xác thực người dùng:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        try {
          // Upsert người dùng Google vào database
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() },
          });

          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                email: user.email.toLowerCase(),
                fullName: user.name || "Cán bộ Người dùng",
                avatarUrl: user.image,
                role: "USER",
                emailVerified: true,
              },
            });
            user.id = newUser.id;
            (user as { role?: string }).role = newUser.role;
          } else {
            user.id = existingUser.id;
            (user as { role?: string }).role = existingUser.role;
            (user as { organization?: string | null }).organization =
              existingUser.organization;
            (user as { jobTitle?: string | null }).jobTitle =
              existingUser.jobTitle;
          }
          return true;
        } catch (err) {
          console.error("Lỗi đồng bộ tài khoản Google OAuth:", err);
          return true; // Cho phép đăng nhập dù DB tạm lỗi
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "USER";
        token.organization =
          (user as { organization?: string | null }).organization || null;
        token.jobTitle =
          (user as { jobTitle?: string | null }).jobTitle || null;
      }

      // Cập nhật session từ client trigger update()
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = (token.role as string) || "USER";
        session.user.organization = (token.organization as string) || "";
        session.user.jobTitle = (token.jobTitle as string) || "";
      }
      return session;
    },
  },
};
