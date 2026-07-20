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
    studentId: true,
    status: true,
    class: {
      select: {
        name: true,
        section: true,
      },
    },
    academicYearId: true,
    student: {
      select: {
        firstName: true,
        lastName: true,
        gender: true,
        dateOfBirth: true,
        address: true,
        city: true,
        state: true,
        enrollmentStatus: true,
        admissionDate: true,
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
        parentLinks: {
          select: {
            parentType: true,
            parent: {
              select: {
                firstName: true,
                lastName: true,
                alternatePhone: true,
                user: {
                  select: {
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

export type StudentListPayload = Prisma.EnrollmentGetPayload<
  typeof StudentList
>;

export const AdminList = Prisma.validator<Prisma.AdminDefaultArgs>()({
  include: {
    user: {
      include: {
        userPermission: true,
      },
    },
    adminAttendance: true,
  },
});

type AdminWithUser = Prisma.AdminGetPayload<typeof AdminList>;

export type AdminListPayload = Omit<AdminWithUser, "user"> & {
  user: Omit<AdminWithUser["user"], "passwordHash">;
};

export const Admins = Prisma.validator<Prisma.AdminDefaultArgs>()({
  select: {
    id: true,
    firstName: true,
    lastName: true,
    photoUrl: true,
    designation: true,
    joiningDate: true,
    gender: true,
    department: true,
  },
});

export type PaginatedAdmins = Prisma.AdminGetPayload<typeof Admins>;
