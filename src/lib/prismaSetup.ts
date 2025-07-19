import { prismaConfig } from "@/types/prismTypes";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "event",
        level: "error",
      },
      {
        emit: "event",
        level: "warn",
      },
    ],
  });

prisma.$on("query", (e: prismaConfig) => {
  const duration = Date.now() - new Date(e.timestamp).getTime();

  if (duration > 100) {
    console.warn("Slow Query:", {
      query: e.query.substring(0, 100),
      duration: `${duration}ms`,
      timestamp: e.timestamp,
    });
  }
});

prisma.$on("error", (e: string) => {
  console.error("Prisma Error:", e);
});

prisma.$on("warn", (e: prismaConfig) => {
  console.warn("Prisma Warning:", e.message);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
