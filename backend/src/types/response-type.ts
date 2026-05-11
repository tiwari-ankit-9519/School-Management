import { Prisma } from "@prisma/client";

export const AdmissionApplicationList =
  Prisma.validator<Prisma.AdmissionApplicationDefaultArgs>()({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      gender: true,
      appliedForClass: true,
      guardianFirstName: true,
      guardianLastName: true,
      guardianPhone: true,
      status: true,
      appliedAt: true,
      createdAt: true,
    },
  });

export type AdmissionApplicationListPayload =
  Prisma.AdmissionApplicationGetPayload<typeof AdmissionApplicationList>;

export const TeacherApplicationList =
  Prisma.validator<Prisma.TeacherApplicationDefaultArgs>()({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      gender: true,
      qualification: true,
      experience: true,
      specialization: true,
      status: true,
      appliedAt: true,
      createdAt: true,
    },
  });

export type TeacherApplicationListPayload = Prisma.TeacherApplicationGetPayload<
  typeof TeacherApplicationList
>;

export const TeacherList = Prisma.validator<Prisma.TeacherDefaultArgs>()({
  select: {
    id: true,
    userId: true,
    firstName: true,
    lastName: true,
    gender: true,
    city: true,
    state: true,
    qualification: true,
    experience: true,
    specialization: true,
    employmentStatus: true,
    joiningDate: true,
    createdAt: true,
  },
});

export type TeacherListPayload = Prisma.TeacherGetPayload<typeof TeacherList>;

export const StudentList = Prisma.validator<Prisma.EnrollmentDefaultArgs>()({
  select: {
    id: true,
    rollNumber: true,
    status: true,
    enrolledAt: true,
    classId: true,
    academicYearId: true,
    student: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        gender: true,
        city: true,
        state: true,
        bloodGroup: true,
        admissionDate: true,
      },
    },
  },
});

export type StudentListPayload = Prisma.EnrollmentGetPayload<
  typeof StudentList
>;
