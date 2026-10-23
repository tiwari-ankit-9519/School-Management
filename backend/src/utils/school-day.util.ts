import { prisma } from "../config/database.config";

const SCHOOL_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export class SchoolDayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchoolDayError";
  }
}

export const toDateOnly = (value: string | Date): Date => {
  if (value instanceof Date) {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
};

export const getSchoolToday = (): Date =>
  toDateOnly(SCHOOL_DATE_FORMAT.format(new Date()));

export const isSundayDate = (date: Date): boolean =>
  toDateOnly(date).getUTCDay() === 0;

export async function getHolidayOn(
  date: Date,
): Promise<{ id: string; name: string } | null> {
  return prisma.holiday.findUnique({
    where: { date: toDateOnly(date) },
    select: { id: true, name: true },
  });
}

export async function assertAttendanceAllowed(
  value: string | Date,
): Promise<Date> {
  const date = toDateOnly(value);
  const label = date.toISOString().slice(0, 10);

  if (date > getSchoolToday()) {
    throw new SchoolDayError(
      `Attendance can't be marked for a future date (${label})`,
    );
  }

  if (isSundayDate(date)) {
    throw new SchoolDayError(
      `Attendance can't be marked on ${label}: it's a Sunday`,
    );
  }

  const holiday = await getHolidayOn(date);
  if (holiday) {
    throw new SchoolDayError(
      `Attendance can't be marked on ${label}: it's a holiday (${holiday.name})`,
    );
  }

  return date;
}
