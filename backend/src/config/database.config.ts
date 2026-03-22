import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createModuleLogger } from "@/src/config/logger.config";
import { Pool } from "pg";

const log = createModuleLogger("DatabaseConfig");
const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const logQueries = process.env.ENABLE_QUERY_LOGGING === "true";
const SLOW_QUERY_THRESHOLD = parseInt(
  process.env.SLOW_QUERY_THRESHOLD ?? "2000",
);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env file");
}

interface PoolStats {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
}

interface DatabaseStats {
  totalUsers: number;
  totalSchools: number;
  totalAuditLogs: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmissions: number;
  pool: PoolStats;
}

interface GlobalWithPrisma {
  prisma?: PrismaClient;
}

type PrismaEventEmitter = {
  $on(event: "query", cb: (e: Prisma.QueryEvent) => void): void;
  $on(event: "error", cb: (e: Prisma.LogEvent) => void): void;
  $on(event: "info", cb: (e: Prisma.LogEvent) => void): void;
  $on(event: "warn", cb: (e: Prisma.LogEvent) => void): void;
};

interface NowResult {
  now: Date;
}

interface DatabaseNameResult {
  current_database: string;
}

interface CountResult {
  count: bigint;
}

interface SizeResult {
  size: string;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX ?? "10"),
  min: parseInt(process.env.DB_POOL_MIN ?? "2"),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS ?? "600000"),
  connectionTimeoutMillis: parseInt(
    process.env.DB_CONNECTION_TIMEOUT_MS ?? "5000",
  ),
  allowExitOnIdle: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on("connect", () => {
  log.debug("New database client connected", {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
});

pool.on("acquire", () => {
  log.debug("Database client acquired from pool", {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  });
});

pool.on("remove", () => {
  log.debug("Database client removed from pool", {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
  });
});

pool.on("error", (error: Error) => {
  log.error("Unexpected database pool error", {
    error: error.message,
    stack: process.env.ENABLE_STACK_TRACE === "true" ? error.stack : undefined,
  });
});

const adapter = new PrismaPg(pool as never);
const globalForPrisma = globalThis as unknown as GlobalWithPrisma;

function interpolateQuery(query: string, params: string | undefined): string {
  if (!params) return query;
  let parsedParams: unknown[];
  try {
    parsedParams = JSON.parse(params) as unknown[];
  } catch {
    return query;
  }
  if (!Array.isArray(parsedParams) || parsedParams.length === 0) {
    return query;
  }
  let paramIndex = 0;
  let interpolated = query;
  interpolated = interpolated.replace(/\$(\d+)/g, (_match, num: string) => {
    const index = parseInt(num) - 1;
    return formatParamValue(parsedParams[index]);
  });
  if (interpolated === query) {
    interpolated = interpolated.replace(/\?/g, () => {
      return formatParamValue(parsedParams[paramIndex++]);
    });
  }
  return interpolated;
}

function formatParamValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === "object")
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return String(value);
}

function humanizeQuery(query: string): string {
  return query
    .replace(/"public"\."(\w+)"\."(\w+)"/g, "$1.$2")
    .replace(/"public"\."(\w+)"/g, "$1")
    .replace(/"(\w+)"\."(\w+)"/g, "$1.$2")
    .replace(/"(\w+)"/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const prismaLogConfig = [
  { emit: "event" as const, level: "query" as const },
  { emit: "event" as const, level: "error" as const },
  { emit: "event" as const, level: "info" as const },
  { emit: "event" as const, level: "warn" as const },
];

const basePrisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: prismaLogConfig,
    errorFormat: isDevelopment ? "colorless" : "minimal",
  });

export const prisma = basePrisma;

if (isProduction) {
  globalForPrisma.prisma = basePrisma;
}

const prismaEmitter = basePrisma as unknown as PrismaEventEmitter;

prismaEmitter.$on("query", (e) => {
  if (!logQueries) return;
  const duration = e.duration;
  const readableQuery = humanizeQuery(interpolateQuery(e.query, e.params));
  const operation = e.target ?? "unknown";
  if (duration > SLOW_QUERY_THRESHOLD) {
    log.warn("Slow Query Detected", {
      query: readableQuery,
      duration: `${duration}ms`,
      target: operation,
      timestamp: new Date(e.timestamp).toISOString(),
    });
  } else {
    log.debug("Prisma Query", {
      query: readableQuery,
      duration: `${duration}ms`,
      timestamp: new Date(e.timestamp).toISOString(),
    });
  }
});

prismaEmitter.$on("error", (e) => {
  log.error("Prisma Error", {
    message: e.message,
    target: e.target,
    timestamp: new Date(e.timestamp).toISOString(),
  });
});

prismaEmitter.$on("info", (e) => {
  if (!logQueries) return;
  log.info("Prisma Info", {
    message: e.message,
    target: e.target,
    timestamp: new Date(e.timestamp).toISOString(),
  });
});

prismaEmitter.$on("warn", (e) => {
  log.warn("Prisma Warning", {
    message: e.message,
    target: e.target,
    timestamp: new Date(e.timestamp).toISOString(),
  });
});

let isDisconnected = false;

export async function connectDatabase(): Promise<void> {
  try {
    const testClient = await pool.connect();
    testClient.release();
    await basePrisma.$connect();
    log.info("Database connected successfully");
    const result = await basePrisma.$queryRaw<NowResult[]>`SELECT NOW() as now`;
    log.info("Database server time", { serverTime: result[0].now });
    const databaseName = await basePrisma.$queryRaw<
      DatabaseNameResult[]
    >`SELECT current_database()`;
    log.info("Connected to database", {
      database: databaseName[0].current_database,
    });
    await checkDatabaseHealth();
  } catch (error) {
    const err = error as Error;
    log.error("Database connection failed", {
      error: err.message,
      stack: process.env.ENABLE_STACK_TRACE === "true" ? err.stack : undefined,
    });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isDisconnected) {
    log.warn("Database already disconnected, skipping");
    return;
  }
  try {
    isDisconnected = true;
    await basePrisma.$disconnect();
    await pool.end();
    log.info("Database disconnected gracefully");
  } catch (error) {
    const err = error as Error;
    log.error("Error disconnecting database", {
      error: err.message,
      stack: process.env.ENABLE_STACK_TRACE === "true" ? err.stack : undefined,
    });
  }
}

async function checkDatabaseHealth(): Promise<void> {
  try {
    const tableCount = await basePrisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;
    const activeConnections = await basePrisma.$queryRaw<CountResult[]>`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    const dbSize = await basePrisma.$queryRaw<SizeResult[]>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    log.debug("Database health check", {
      tables: Number(tableCount[0].count),
      activeConnections: Number(activeConnections[0].count),
      databaseSize: dbSize[0].size,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    });
  } catch (error) {
    const err = error as Error;
    log.warn("Could not perform full database health check", {
      error: err.message,
    });
  }
}

export async function checkConnection(): Promise<boolean> {
  try {
    await basePrisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export function getPoolStats(): PoolStats {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  try {
    const [users, schools, auditLogs, students, teachers, admissions] =
      await Promise.all([
        prisma.user.count(),
        prisma.school.count(),
        prisma.auditLog.count(),
        prisma.student.count(),
        prisma.teacher.count(),
        prisma.admissionApplication.count(),
      ]);
    return {
      totalUsers: users,
      totalSchools: schools,
      totalAuditLogs: auditLogs,
      totalStudents: students,
      totalTeachers: teachers,
      totalAdmissions: admissions,
      pool: getPoolStats(),
    };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to get database stats", { error: err.message });
    return {
      totalUsers: 0,
      totalSchools: 0,
      totalAuditLogs: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalAdmissions: 0,
      pool: getPoolStats(),
    };
  }
}
