import NextAuth from "next-auth";
import authConfig from "@/lib/auth.config";
import prisma from "@/lib/prismaSetup";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/lib/zod";
import bcrypt from "bcryptjs";
import type { User } from "next-auth";
import redis, { getJSON, setJSON } from "./redisSetup";

const getCachedAdmin = async (email: string) => {
  const cacheKey = `admin:${email}`;
  let admin = await getJSON(cacheKey);

  if (!admin) {
    admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (admin) {
      await setJSON(cacheKey, admin, { ex: 300 });
    }
  }

  return admin;
};

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials): Promise<User | null> => {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { email, password } = await signInSchema.parseAsync(
            credentials
          );

          const admin = await getCachedAdmin(email);

          if (!admin || !admin.isActive) {
            return null;
          }

          const isPasswordMatch = await bcrypt.compare(
            password,
            admin.passwordHash
          );

          if (!isPasswordMatch) {
            return null;
          }

          prisma.admin
            .update({
              where: { id: admin.id },
              data: { lastLogin: new Date() },
            })
            .catch((error) => {
              console.error("Failed to update lastLogin:", error);
            });

          const cacheKey = `admin:${email}`;
          redis.del(cacheKey).catch((error) => {
            console.error("Failed to clear cache:", error);
          });

          const user: User = {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isActive: admin.isActive,
            preferredLanguage: admin.preferredLanguage,
            image: admin.profileImage,
            phone: admin.phone,
          };

          return user;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.preferredLanguage = user.preferredLanguage;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.preferredLanguage = token.preferredLanguage as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",
});
