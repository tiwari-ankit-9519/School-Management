import { prisma } from "../config/database.config";

export function buildSchoolPrefix(schoolName: string): string {
  const words = schoolName.trim().split(/\s+/);
  let prefix = "";

  for (const word of words) {
    const clean = word.replace(/[^a-zA-Z]/g, "");
    if (clean.length > 0) {
      prefix += clean[0].toUpperCase();
    }
    if (prefix.length >= 4) break;
  }

  if (prefix.length < 2) {
    prefix = schoolName
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 4);
  }

  return prefix;
}

export async function generateSchoolCode(schoolName: string): Promise<string> {
  const prefix = buildSchoolPrefix(schoolName);

  const lastSchool = await prisma.school.findFirst({
    where: {
      code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      code: "desc",
    },
    select: {
      code: true,
    },
  });

  let nextCounter = 1;

  if (lastSchool) {
    const existingNumber = parseInt(lastSchool.code.replace(prefix, ""), 10);
    if (!isNaN(existingNumber)) {
      nextCounter = existingNumber + 1;
    }
  }

  return `${prefix}${String(nextCounter).padStart(3, "0")}`;
}
