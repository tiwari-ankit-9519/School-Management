import { ApplicationStatus } from "@prisma/client";
import { prisma } from "../config/database.config";
import { shutdownLogger } from "../config/logger.config";

const isDryRun = process.argv.includes("--dry-run");

async function backfillStudents(): Promise<number> {
  const students = await prisma.student.findMany({
    where: { photoUrl: null, admissionId: { not: null } },
    select: { id: true, admission: { select: { photoUrl: true } } },
  });

  let updated = 0;
  for (const student of students) {
    const photoUrl = student.admission?.photoUrl;
    if (!photoUrl) continue;
    if (!isDryRun) {
      await prisma.student.update({
        where: { id: student.id },
        data: { photoUrl },
      });
    }
    updated += 1;
  }
  return updated;
}

async function backfillTeachers(): Promise<number> {
  const teachers = await prisma.teacher.findMany({
    where: { photoUrl: null },
    select: { id: true, user: { select: { email: true } } },
  });

  let updated = 0;
  for (const teacher of teachers) {
    const email = teacher.user.email;
    if (!email) continue;
    const application = await prisma.teacherApplication.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        status: ApplicationStatus.SELECTED,
        photoUrl: { not: null },
      },
      orderBy: { reviewedAt: "desc" },
      select: { photoUrl: true },
    });
    if (!application?.photoUrl) continue;
    if (!isDryRun) {
      await prisma.teacher.update({
        where: { id: teacher.id },
        data: { photoUrl: application.photoUrl },
      });
    }
    updated += 1;
  }
  return updated;
}

async function backfillParents(): Promise<number> {
  const parents = await prisma.parent.findMany({
    where: { photoUrl: null },
    select: {
      id: true,
      children: {
        select: {
          parentType: true,
          student: {
            select: {
              admission: {
                select: { guardianRelation: true, guardianPhotoUrl: true },
              },
            },
          },
        },
      },
    },
  });

  let updated = 0;
  for (const parent of parents) {
    const match = parent.children.find(
      (link) =>
        link.student.admission?.guardianPhotoUrl &&
        link.student.admission.guardianRelation === link.parentType,
    );
    const photoUrl = match?.student.admission?.guardianPhotoUrl;
    if (!photoUrl) continue;
    if (!isDryRun) {
      await prisma.parent.update({
        where: { id: parent.id },
        data: { photoUrl },
      });
    }
    updated += 1;
  }
  return updated;
}

async function main(): Promise<void> {
  console.log(
    isDryRun
      ? "Dry run: no changes will be written"
      : "Backfilling profile photos",
  );
  const students = await backfillStudents();
  const teachers = await backfillTeachers();
  const parents = await backfillParents();
  console.log(
    `Students: ${students}, Teachers: ${teachers}, Parents: ${parents}`,
  );
}

async function cleanup(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Failed to disconnect Prisma", error);
  }
  try {
    await shutdownLogger();
  } catch (error) {
    console.error("Failed to shut down logger", error);
  }
}

main()
  .then(() => {
    process.exitCode = process.exitCode ?? 0;
  })
  .catch((error) => {
    console.error("Backfill failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    process.exit(process.exitCode ?? 0);
  });
