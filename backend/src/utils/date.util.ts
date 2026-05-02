import { prisma } from "../config/database.config";

export function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

export async function isHoliday(
  schoolId: string,
  date: Date,
): Promise<boolean> {
  if (isSunday(date)) return true;
  const holiday = await prisma.holiday.findFirst({
    where: { schoolId, date },
  });
  return !!holiday;
}
