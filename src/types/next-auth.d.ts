import { DefaultSession } from "next-auth";
import { AdminRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AdminRole;
      preferredLanguage: string;
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    preferredLanguage: string;
    isActive: boolean;
    phone: string | null;
    image: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AdminRole;
    preferredLanguage: string;
    isActive: boolean;
  }
}
