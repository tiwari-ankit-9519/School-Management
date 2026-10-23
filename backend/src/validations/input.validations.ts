import { z } from "zod";
import {
  ApplicationStatus,
  AttendanceStatus,
  DocumentType,
  ExamType,
  Gender,
  LeaveStatus,
  Module,
  ParentType,
  Prisma,
} from "@prisma/client";
import { error } from "console";

export const LoginInputSchema = z
  .object({
    email: z.string().email({ error: "Please provide valid email" }).optional(),
    regNumber: z.string().optional(),
    password: z.string({ error: "Password is required" }),
  })
  .refine((data) => data.email || data.regNumber, {
    message: "Either email or registration number is required",
  });

export const ChangePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(6, { error: "Minimum 6 digit password is required" })
    .max(20, { error: "Password can be of maximum 20 digits" }),
  newPassword: z
    .string()
    .min(6, { error: "Minimum 6 digit password is required" })
    .max(20, { error: "Password can be of maximum 20 digits" }),
});

export const SendResetPasswordSchema = z
  .object({
    email: z.email({ error: "Please provide valid email" }).optional(),
    regNumber: z.string().optional(),
    phone: z
      .string({ error: "Phone number is required" })
      .regex(/^\+?[0-9]{7,15}$/, {
        error: "Phone number must be 7 to 15 digits and can start with +",
      })
      .optional(),
  })
  .refine((data) => data.email || data.regNumber || data.phone, {
    error: "Either email, registration number or phone is required",
  });

export const ResetPasswordSchema = z
  .object({
    email: z.email({ error: "Please provide valid email" }).optional(),
    regNumber: z.string().optional(),
    token: z.string({ error: "Token is required" }),
    newPassword: z
      .string()
      .min(6, { error: "Minimum 6 digit password is required" })
      .max(20, { error: "Password can be of maximum 20 digits" }),
  })
  .refine((data) => data.email || data.regNumber, {
    error: "Either email, registration number or phone is required",
  });

export interface TeacherApplicationStatusResponse {
  id: string;
  status: ApplicationStatus;
  updatedAt: string;
  rejectionReason?: string | null;
}

export const AcademicYearSchema = z
  .object({
    name: z
      .string()
      .min(3, { error: "Name should be of atleast 3 characters" })
      .max(10, { error: "Name should be of max 10 characters" })
      .regex(/^\d{4}-\d{2,4}$/, {
        error: "Name should be in format 2024-25 or 2024-2025",
      })
      .trim(),
    startDate: z.coerce.date({ error: "Start date is required" }),
    endDate: z.coerce.date({ error: "End date is required" }),
    isCurrent: z.coerce.boolean(),
  })
  .refine((data) => data.endDate > data.startDate, {
    error: "End date must be after start date",
    path: ["endDate"],
  });

// ─────────────────────────────────────────────
// CLASS & SUBJECT
// ─────────────────────────────────────────────

export const ClassSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Class name is required" })
    .max(10, { error: "Class name should be atmost 10 characters" })
    .trim(),
  section: z
    .string()
    .min(1, { error: "Section should be of atleast 1 character" })
    .max(2, { error: "Section should be of atmost 2 characters" })
    .trim(),
  capacity: z.coerce
    .number({ error: "Capacity must be a number" })
    .min(10, { error: "Minimum capacity is 10" })
    .max(50, {
      error: "Maximum of 50 students can be enrolled in a single class",
    }),
  roomNumber: z
    .string()
    .min(3, { error: "Room number should be of atleast three characters" })
    .max(10, { error: "Room number should be atmost 10 characters" })
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? null : val)),
});

export const SubjectSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Subject name should of minimum 2 characters" })
    .max(15, { error: "Subject should be atmost of 15 characters" })
    .trim(),
  code: z
    .string()
    .min(2, { error: "Code must be atleast of 2 characters" })
    .max(8, { error: "Code must be of atmost 8 characters" })
    .trim(),
});

export const modulePermissionSchema = z.object({
  module: z.enum(Module),
  canCreate: z.boolean().default(false),
  canRead: z.boolean().default(true),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canApprove: z.boolean().default(false),
  canExport: z.boolean().default(false),
});

export const ModeratorSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, { error: "First name should be of atleast 2 characters" })
      .max(20, { error: "First name should be of atmost 20 characters" }),
    lastName: z
      .string()
      .trim()
      .min(2, { error: "Last name should be of atleast 2 characters" })
      .max(20, { error: "Last name should be of atmost 20 characters" }),
    gender: z.enum(Gender),
    dateOfBirth: z.coerce
      .date({ error: "Date is required" })
      .refine((date) => date < new Date(), {
        error: "Date of birth should be in past",
      }),
    email: z.email({ error: "Please provide a valid email address" }),
    phone: z
      .string({ error: "Phone number is required" })
      .regex(/^\+?[0-9]{7,15}$/, {
        error: "Phone number must be 7 to 15 digits and can start with +",
      }),
    designation: z
      .string()
      .trim()
      .max(100, { error: "Designation must be of atmost 100 characters" })
      .optional(),
    department: z
      .string()
      .trim()
      .max(100, { error: "Department must be of atmost 100 characters" })
      .optional(),
    permissions: z
      .array(modulePermissionSchema)
      .min(1, { error: "Atleast 1 module permission is required" })
      .refine(
        (perms) => {
          const modules = perms.map((p) => p.module);
          return new Set(modules).size === modules.length;
        },
        { error: "Duplicate modules are not allowed" },
      ),
    isTeacher: z.boolean().default(false),
    address: z
      .string()
      .min(10, { error: "Address must be at least 10 characters" })
      .max(200, { error: "Address must be at most 200 characters" })
      .trim()
      .optional(),
    city: z
      .string()
      .min(2, { error: "City must be at least 2 characters" })
      .max(50, { error: "City must be at most 50 characters" })
      .trim()
      .optional(),
    state: z
      .string()
      .min(2, { error: "State must be at least 2 characters" })
      .max(50, { error: "State must be at most 50 characters" })
      .trim()
      .optional(),
    pincode: z
      .string()
      .regex(/^\d{4,10}$/, { error: "Pincode must be 4 to 10 digits" })
      .optional(),
    qualification: z
      .string()
      .trim()
      .min(2, { error: "Qualification should be of atleast 2 characters" })
      .max(40, { error: "Qualification should be of atmost 40 characters" })
      .optional(),
    experience: z.coerce.number().optional(),
    specialization: z.string().optional(),
    joiningDate: z.string().date().optional(),
  })
  .refine(
    (data) => {
      if (data.isTeacher) {
        return (
          data.address &&
          data.city &&
          data.state &&
          data.pincode &&
          data.qualification &&
          data.joiningDate
        );
      }
      return true;
    },
    { error: "Teaching details are required when isTeacher is true" },
  );

export const UpdateUserPermissionSchema = z.object({
  userId: z.string().min(1, { error: "User ID is required" }),
  permissions: z
    .array(modulePermissionSchema)
    .min(1, { error: "At least 1 module permission is required" })
    .refine(
      (perms) => {
        const modules = perms.map((p) => p.module);
        return new Set(modules).size === modules.length;
      },
      { error: "Duplicate modules are not allowed" },
    ),
});

export const TeacherApplicationSchema = z.object({
  firstName: z
    .string({ error: "First Name is required" })
    .trim()
    .min(2, { error: "First name should be of atleast 2 characters" })
    .max(20, { error: "First name should be of atmost 20 characters" }),
  lastName: z
    .string({ error: "Last Name is required" })
    .trim()
    .min(2, { error: "Last name should be of atleast 2 characters" })
    .max(20, { error: "Last name should be of atmost 20 characters" }),
  email: z.email({ error: "Please provide a valid email address" }),
  phone: z
    .string({ error: "Phone number is required" })
    .regex(/^\+?[0-9]{7,15}$/, {
      error: "Phone number must be 7 to 15 digits and can start with +",
    }),
  gender: z.enum(Gender),
  dateOfBirth: z.coerce
    .date({ error: "Date is required" })
    .refine((date) => date < new Date(), {
      error: "Date of birth should be in past",
    }),
  address: z
    .string({ error: "Address is required" })
    .min(10, { error: "Address must be at least 10 characters" })
    .max(200, { error: "Address must be at most 200 characters" })
    .trim(),
  city: z
    .string({ error: "City is required" })
    .min(2, { error: "City must be at least 2 characters" })
    .max(50, { error: "City must be at most 50 characters" })
    .trim(),
  state: z
    .string({ error: "State is required" })
    .min(2, { error: "State must be at least 2 characters" })
    .max(50, { error: "State must be at most 50 characters" })
    .trim(),
  pincode: z
    .string({ error: "Pincode is required" })
    .regex(/^\d{4,10}$/, { error: "Pincode must be 4 to 10 digits" }),
  qualification: z
    .string({ error: "Qualification details are required" })
    .trim()
    .min(2, { error: "Qualification should be of atleast 2 characters" })
    .max(40, { error: "Qualification should be of atmost 40 characters" }),
  experience: z.coerce.number({ error: "Experience is required" }),
  specialization: z.string({ error: "Specialization is required" }).optional(),
  photoUrl: z.url({ error: "Please provide a valid photo URL" }).optional(),
  documents: z
    .array(
      z.object({
        documentType: z.enum(DocumentType),
        title: z.string().min(2).max(100).trim(),
      }),
    )
    .optional(),
});

export const ResubmitTeacherApplicationSchema = z
  .object({
    specialization: z
      .string({ error: "Specialization is required" })
      .optional(),
    documents: z
      .array(
        z.object({
          documentType: z.enum(DocumentType),
          title: z.string().min(2).max(100).trim(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      const { documents, ...rest } = data;
      const hasFields = Object.values(rest).some(
        (value) => value !== undefined,
      );
      const hasDocuments = documents && documents.length > 0;
      return hasFields || hasDocuments;
    },
    {
      message:
        "At least one field or document must be provided for resubmission",
    },
  );

// ─────────────────────────────────────────────
// ADMISSION APPLICATION
// ─────────────────────────────────────────────

const classGrade = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z
    .union([
      z.string().regex(/^([1-9]|1[0-2])$/, {
        error: "Class must be a number between 1 and 12",
      }),
      z.enum(["KG", "LKG", "UKG", "Nursery"], {
        error:
          "Class must be one of: KG, LKG, UKG, Nursery or a number between 1-12",
      }),
    ])
    .optional(),
);

export const AdmissionApplicationSchema = z
  .object({
    firstName: z
      .string({ error: "First name is required" })
      .trim()
      .min(2, { error: "First name should be at least 2 characters" })
      .max(20, { error: "First name should be at most 20 characters" }),
    lastName: z
      .string({ error: "Last name is required" })
      .trim()
      .min(2, { error: "Last name should be at least 2 characters" })
      .max(20, { error: "Last name should be at most 20 characters" }),
    gender: z.enum(Gender, { error: "Gender is required" }),
    dateOfBirth: z.coerce
      .date({ error: "Date of birth is required" })
      .refine((date) => date < new Date(), {
        error: "Date of birth should be in the past",
      }),
    address: z
      .string({ error: "Address is required" })
      .trim()
      .min(10, { error: "Address must be at least 10 characters" })
      .max(200, { error: "Address must be at most 200 characters" }),
    city: z
      .string({ error: "City is required" })
      .trim()
      .min(2, { error: "City must be at least 2 characters" })
      .max(50, { error: "City must be at most 50 characters" }),
    state: z
      .string({ error: "State is required" })
      .trim()
      .min(2, { error: "State must be at least 2 characters" })
      .max(50, { error: "State must be at most 50 characters" }),
    pincode: z
      .string({ error: "Pincode is required" })
      .regex(/^\d{4,10}$/, { error: "Pincode must be 4 to 10 digits" }),
    previousSchool: z.string().trim().optional(),
    previousClass: classGrade,
    appliedForClass: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.union([
        z.string().regex(/^([1-9]|1[0-2])$/, {
          error: "Class must be a number between 1 and 12",
        }),
        z.enum(["KG", "LKG", "UKG", "Nursery"], {
          error:
            "Class must be one of: KG, LKG, UKG, Nursery or a number between 1-12",
        }),
      ]),
    ),
    guardianFirstName: z
      .string({ error: "Guardian first name is required" })
      .trim()
      .min(2, { error: "Guardian first name should be at least 2 characters" })
      .max(20, {
        error: "Guardian first name should be at most 20 characters",
      }),
    guardianLastName: z
      .string({ error: "Guardian last name is required" })
      .trim()
      .min(2, { error: "Guardian last name should be at least 2 characters" })
      .max(20, { error: "Guardian last name should be at most 20 characters" }),
    guardianRelation: z.enum(ParentType, {
      error: "Guardian relation is required",
    }),
    guardianPhone: z
      .string({ error: "Guardian phone is required" })
      .regex(/^\+?[1-9]\d{7,14}$/, { error: "Invalid phone number" }),
    guardianEmail: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().trim().email({ error: "Invalid email address" }).optional(),
    ),
    photoUrl: z.string().optional(),
    guardianPhotoUrl: z.string().optional(),
    documents: z
      .array(
        z.object({
          documentType: z.enum(DocumentType),
          title: z.string().min(2).max(100).trim(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.previousClass !== undefined && !data.previousSchool) {
        return false;
      }
      return true;
    },
    {
      error: "Previous school name is required when previous class is provided",
      path: ["previousSchool"],
    },
  )
  .refine(
    (data) => {
      if (
        data.previousSchool !== undefined &&
        data.previousClass === undefined
      ) {
        return false;
      }
      return true;
    },
    {
      error: "Previous class is required when previous school is provided",
      path: ["previousClass"],
    },
  );

export const ResubmitAdmissionApplicationSchema = z
  .object({
    previousSchool: z
      .string()
      .trim()
      .min(2, { error: "Previous school name should be at least 2 characters" })
      .max(100, {
        error: "Previous school name should be at most 100 characters",
      })
      .optional(),
    previousClass: classGrade.optional(),
    guardianEmail: z
      .string()
      .trim()
      .email({ error: "Invalid email address" })
      .optional(),
    documents: z
      .array(
        z.object({
          documentType: z.enum(DocumentType),
          title: z.string().min(2).max(100).trim(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      if (data.previousClass !== undefined && !data.previousSchool) {
        return false;
      }
      return true;
    },
    {
      error: "Previous school name is required when previous class is provided",
      path: ["previousSchool"],
    },
  )
  .refine(
    (data) => {
      if (
        data.previousSchool !== undefined &&
        data.previousClass === undefined
      ) {
        return false;
      }
      return true;
    },
    {
      error: "Previous class is required when previous school is provided",
      path: ["previousClass"],
    },
  );

export const RejectAdmissionApplicationSchema = z.object({
  rejectionReason: z
    .string({ error: "Rejection reason is required" })
    .min(10, { error: "Rejection reason must be at least 10 characters" })
    .max(500, { error: "Rejection reason must be at most 500 characters" })
    .trim(),
});

// ─────────────────────────────────────────────
// TIMETABLE
// ─────────────────────────────────────────────

export const CreateTimeTableSchema = z.array(
  z.object({
    dayOfWeek: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ]),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "Start time must be in HH:MM format",
    }),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
      message: "End time must be in HH:MM format",
    }),
    periodNumber: z.coerce.number().int().min(1).max(10),
    classId: z.string(),
    subjectId: z.string(),
    teacherId: z.string(),
    room: z.string().optional(),
  }),
);

export const UpdateTimeTableSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Start time must be in HH:MM format",
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "End time must be in HH:MM format",
  }),
  room: z.string().optional(),
  teacherId: z.string().optional(),
  subjectId: z.string().optional(),
});

// ─────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────

export const StudentAttendanceSchema = z.object({
  date: z.iso.date(),
  attendance: z.array(
    z.object({
      studentId: z.string({ error: "Student ID is required" }),
      status: z.enum(AttendanceStatus),
    }),
  ),
});

export const TeacherAttendanceSchema = z.object({
  date: z.iso.date(),
  attendance: z.array(
    z.object({
      teacherId: z.string({ error: "Teacher ID is required" }),
      status: z.enum(AttendanceStatus),
    }),
  ),
});

export const ModeratorAttendanceSchema = z.object({
  date: z.iso.date(),
  attendance: z.array(
    z.object({
      moderatorId: z.string({ error: "Moderator ID is required" }),
      status: z.enum(AttendanceStatus),
    }),
  ),
});

// ─────────────────────────────────────────────
// EXAM & MARKS
// ─────────────────────────────────────────────

export const ExamScheduleSchema = z.object({
  examType: z.enum(ExamType),
  title: z.string({ error: "Title is required" }),
  date: z.iso.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Start time must be in HH:MM format",
  }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "End time must be in HH:MM format",
  }),
  totalMarks: z.coerce.number().min(1),
  passingMarks: z.coerce.number().min(1),
  weightage: z.coerce.number().min(0).max(100),
  instructions: z.string().optional(),
  entries: z
    .array(
      z.object({
        subjectId: z.string({ error: "Subject Id is required" }),
        teacherId: z.string({ error: "Teacher Id is required" }),
      }),
    )
    .min(1, { message: "At least one subject entry is required" }),
});

export const MarksSchema = z
  .object({
    examScheduleId: z.string({ error: "Exam ID is required" }),
    entries: z
      .array(
        z.object({
          studentId: z.string({ error: "Student ID is required" }),
          marksObtained: z.coerce.number().min(0),
          remarks: z.string().optional(),
          isAbsent: z.boolean().optional(),
          grade: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
        }),
      )
      .min(1, { message: "At least one entry is required" }),
  })
  .superRefine((data, ctx) => {
    data.entries.forEach((entry, index) => {
      if (entry.isAbsent && entry.marksObtained > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Marks obtained must be 0 if student is absent",
          path: ["entries", index, "marksObtained"],
        });
      }
    });
  });

export const updateMarkSchema = z
  .object({
    marksObtained: z.number().min(0).optional(),
    grade: z.string().trim().optional(),
    remarks: z.string().trim().optional(),
    isAbsent: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  })
  .refine(
    (data) =>
      !(
        data.isAbsent === true &&
        data.marksObtained !== undefined &&
        data.marksObtained > 0
      ),
    { message: "Marks obtained cannot be greater than 0 if student is absent" },
  );

// ─────────────────────────────────────────────
// LEAVE
// ─────────────────────────────────────────────

export const createLeaveRequestSchema = z
  .object({
    fromDate: z.iso.date("Invalid date format, expected YYYY-MM-DD"),
    toDate: z.iso.date("Invalid date format, expected YYYY-MM-DD"),
    reason: z
      .string()
      .trim()
      .min(10, "Reason must be at least 10 characters")
      .max(500, "Reason must be at most 500 characters"),
  })
  .refine((data) => new Date(data.toDate) >= new Date(data.fromDate), {
    message: "toDate must be greater than or equal to fromDate",
    path: ["toDate"],
  });

export const reviewLeaveRequestSchema = z
  .object({
    status: z.enum(LeaveStatus),
    remarks: z
      .string()
      .trim()
      .min(5, "Remarks must be at least 5 characters")
      .max(500, "Remarks must be at most 500 characters")
      .optional(),
  })
  .refine((data) => !(data.status === "REJECTED" && !data.remarks), {
    message: "Remarks are required when rejecting a leave request",
    path: ["remarks"],
  });

// ─────────────────────────────────────────────
// HOLIDAY
// ─────────────────────────────────────────────

export const CreateHolidaySchema = z.object({
  name: z.string({ error: "Name is required" }),
  date: z.iso.date({ error: "Date is required" }),
});

// ─────────────────────────────────────────────
// TEACHER & CLASS ASSIGNMENTS
// ─────────────────────────────────────────────

export const AssignTeacherToSubjectSchema = z.object({
  teacherId: z.string({ error: "Teacher ID is required" }),
  classId: z.string({ error: "Class ID is required" }),
});

export const AssignClassTeacherSchema = z.object({
  teacherId: z.string({ error: "Teacher ID is required" }),
  classId: z.string({ error: "Class ID is required" }),
});

// ─────────────────────────────────────────────
// PRISMA SELECTORS
// ─────────────────────────────────────────────

export const safeUserSelect = {
  id: true,
  regNumber: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  isVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

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

export const StudentList = Prisma.validator<Prisma.StudentDefaultArgs>()({
  select: {
    id: true,
    userId: true,
    firstName: true,
    lastName: true,
    gender: true,
    city: true,
    state: true,
    bloodGroup: true,
    enrollmentStatus: true,
    admissionDate: true,
    createdAt: true,
  },
});

export const moderatorWithDetails = Prisma.validator<Prisma.AdminDefaultArgs>()(
  {
    include: {
      user: {
        select: {
          ...safeUserSelect,
          userPermission: true,
        },
      },
    },
  },
);

export const teacherWithDetails = Prisma.validator<Prisma.TeacherDefaultArgs>()(
  {
    include: {
      user: {
        select: {
          ...safeUserSelect,
          userPermission: true,
        },
      },
    },
  },
);

export const studentWithDetails = Prisma.validator<Prisma.StudentDefaultArgs>()(
  {
    include: {
      user: { select: safeUserSelect },
      parentLinks: true,
      documents: true,
      enrollments: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              section: true,
              roomNumber: true,
              capacity: true,
            },
          },
          academicYear: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
            },
          },
        },
      },
      attendances: true,
      marks: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
          examSchedule: {
            select: {
              id: true,
              title: true,
              examType: true,
              date: true,
              totalMarks: true,
              passingMarks: true,
            },
          },
        },
      },
      feePayments: {
        include: {
          feeStructure: {
            select: { id: true, name: true, amount: true },
          },
        },
      },
      leaveRequests: true,
    },
  },
);

export const studentWithClassDetails =
  Prisma.validator<Prisma.EnrollmentDefaultArgs>()({
    include: {
      student: {
        include: {
          user: { select: safeUserSelect },
          parentLinks: true,
          documents: true,
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          section: true,
          roomNumber: true,
          capacity: true,
        },
      },
      academicYear: {
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          isCurrent: true,
        },
      },
    },
  });

export const userPermissionWithDetails =
  Prisma.validator<Prisma.UserDefaultArgs>()({
    select: {
      id: true,
      regNumber: true,
      role: true,
      email: true,
      phone: true,
      isActive: true,
      userPermission: true,
    },
  });

const recurringMonthField = z
  .number({ error: "Billing month must be a number" })
  .int({ error: "Billing month must be a whole number" })
  .min(1, {
    error: "Billing month must be between 1 (January) and 12 (December)",
  })
  .max(12, {
    error: "Billing month must be between 1 (January) and 12 (December)",
  })
  .nullable()
  .optional();

const feeNameField = z
  .string({ error: "Name is required" })
  .trim()
  .min(2, { error: "Name must be at least 2 characters" })
  .max(60, { error: "Name must be at most 60 characters" });

const feeAmountField = z
  .number({ error: "Amount is required" })
  .positive({ error: "Amount must be greater than 0" })
  .max(10_000_000, { error: "Amount looks too large" });

const feeDescriptionField = z
  .string()
  .trim()
  .max(300, { error: "Description must be at most 300 characters" })
  .optional();

export const FeesStructurePayload = z
  .object({
    name: feeNameField,
    amount: feeAmountField,
    description: feeDescriptionField,
    isRecurring: z.boolean().optional().default(false),
    recurringMonth: recurringMonthField,
  })
  .refine((data) => data.isRecurring || data.recurringMonth == null, {
    error: "A billing month can only be set on a recurring fee",
    path: ["recurringMonth"],
  });

export const FeesStructureUpdatePayload = z
  .object({
    name: feeNameField.optional(),
    amount: feeAmountField.optional(),
    description: feeDescriptionField,
    isRecurring: z.boolean().optional(),
    recurringMonth: recurringMonthField,
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "Provide at least one field to update",
  })
  .refine((data) => data.isRecurring !== false || data.recurringMonth == null, {
    error: "A billing month can only be set on a recurring fee",
    path: ["recurringMonth"],
  });

export const UpdateSchoolSettingsPayload = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9\s-]{6,14}$/, {
        error: "Enter a valid phone number",
      })
      .optional(),
    email: z
      .string()
      .trim()
      .email({ error: "Enter a valid email address" })
      .optional(),
    website: z
      .union([
        z.literal(""),
        z
          .string()
          .trim()
          .url({ error: "Website must be a full URL starting with https://" }),
      ])
      .optional(),
    address: z
      .string()
      .trim()
      .min(10, { error: "Address must be at least 10 characters" })
      .max(200, { error: "Address must be at most 200 characters" })
      .optional(),
    city: z
      .string()
      .trim()
      .min(2, { error: "City must be at least 2 characters" })
      .max(50, { error: "City must be at most 50 characters" })
      .optional(),
    state: z
      .string()
      .trim()
      .min(2, { error: "State must be at least 2 characters" })
      .max(50, { error: "State must be at most 50 characters" })
      .optional(),
    country: z
      .string()
      .trim()
      .min(2, { error: "Country must be at least 2 characters" })
      .max(56, { error: "Country must be at most 56 characters" })
      .optional(),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{4,10}$/, { error: "Pincode must be 4 to 10 digits" })
      .optional(),
    feeDueDay: z
      .number({ error: "Due day must be a number" })
      .int({ error: "Due day must be a whole number" })
      .min(1, { error: "Due day must be between 1 and 28" })
      .max(28, { error: "Due day must be between 1 and 28" })
      .optional(),
    allowPartialPayments: z
      .boolean({ error: "allowPartialPayments must be true or false" })
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    error: "Provide at least one field to update",
  });

export type AdmissionApplicationStatusResponse = {
  id: string;
  status: string;
  updatedAt: string;
  rejectionReason?: string | null;
  waitlistReason?: string | null;
  waitlistPosition?: number | null;
  slotOfferedAt?: string | null;
  slotExpiresAt?: string | null;
  slotOfferedClass?: string | null;
};

const COLLECTABLE_MODES = [
  "CASH",
  "UPI",
  "CHEQUE",
  "BANK_TRANSFER",
  "CARD",
] as const;
const MODES_NEEDING_REFERENCE = ["UPI", "CHEQUE", "BANK_TRANSFER", "CARD"];

const queryBoolean = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean().optional(),
);

const queryInt = (fallback: number, max: number) =>
  z.preprocess(
    (value) => (value === undefined || value === "" ? fallback : Number(value)),
    z.number().int().min(1).max(max),
  );

export const WaiveFeePaymentPayload = z.object({
  amount: z
    .number({ error: "Amount must be a number" })
    .positive({ error: "Amount must be greater than 0" })
    .optional(),
  reason: z
    .string({ error: "A reason is required to waive fees" })
    .trim()
    .min(5, { error: "Reason must be at least 5 characters" })
    .max(300, { error: "Reason must be at most 300 characters" }),
});

export const FeePaymentListQuery = z.object({
  page: queryInt(1, 10_000),
  limit: queryInt(10, 100),
  status: z
    .enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"])
    .optional(),
  academicYearId: z.string().trim().min(1).optional(),
  classId: z.string().trim().min(1).optional(),
  classGroupId: z.string().trim().min(1).optional(),
  feeStructureId: z.string().trim().min(1).optional(),
  billingPeriod: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
      error: "Billing period must be YYYY-MM",
    })
    .optional(),
  overdueOnly: queryBoolean,
  search: z.string().trim().max(60).optional(),
  sortBy: z
    .enum(["dueDate", "createdAt", "paymentDate", "amountDue"])
    .optional()
    .default("dueDate"),
  order: z.enum(["asc", "desc"]).optional().default("asc"),
});

const MAX_BILLS_PER_RECEIPT = 24;

export const CollectStudentFeesPayload = z
  .object({
    billIds: z
      .array(z.string().trim().min(1), { error: "Select at least one bill" })
      .min(1, { error: "Select at least one bill" })
      .max(MAX_BILLS_PER_RECEIPT, {
        error: `A receipt can cover at most ${MAX_BILLS_PER_RECEIPT} bills`,
      })
      .refine((ids) => new Set(ids).size === ids.length, {
        error: "The same bill can't be selected twice",
      }),
    amount: z
      .number({ error: "Amount is required" })
      .positive({ error: "Amount must be greater than 0" })
      .max(10_000_000, { error: "Amount looks too large" }),
    paymentMode: z.enum(COLLECTABLE_MODES, {
      error: "Payment mode must be cash, UPI, cheque, bank transfer or card",
    }),
    referenceNumber: z
      .string()
      .trim()
      .max(64, { error: "Reference number must be at most 64 characters" })
      .optional(),
    paidAt: z
      .string()
      .date("Payment date must be in YYYY-MM-DD format")
      .refine((value) => new Date(value) <= new Date(), {
        error: "Payment date cannot be in the future",
      })
      .optional(),
    remarks: z
      .string()
      .trim()
      .max(300, { error: "Remarks must be at most 300 characters" })
      .optional(),
  })
  .refine(
    (data) =>
      !MODES_NEEDING_REFERENCE.includes(data.paymentMode) ||
      !!data.referenceNumber,
    {
      error:
        "Reference number is required for UPI, cheque, bank transfer and card payments",
      path: ["referenceNumber"],
    },
  );

export const ReverseFeeReceiptPayload = z.object({
  reason: z
    .string({ error: "A reason is required to reverse a receipt" })
    .trim()
    .min(10, { error: "Reason must be at least 10 characters" })
    .max(300, { error: "Reason must be at most 300 characters" }),
});

export const DashboardCalendarQuery = z.object({
  month: z
    .string({ error: "Month is required" })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
      error: "Month must be in YYYY-MM format",
    }),
});

export const FeeStudentListQuery = z.object({
  page: queryInt(1, 10_000),
  limit: queryInt(15, 100),
  academicYearId: z.string().trim().min(1).optional(),
  classId: z.string().trim().min(1).optional(),
  classGroupId: z.string().trim().min(1).optional(),
  search: z.string().trim().max(60).optional(),
  dueStatus: z
    .enum(["ALL", "DUE", "OVERDUE", "CLEARED"])
    .optional()
    .default("ALL"),
  sortBy: z
    .enum(["outstanding", "overdue", "name", "lastPayment"])
    .optional()
    .default("outstanding"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type CollectStudentFeesType = z.infer<typeof CollectStudentFeesPayload>;
export type ReverseFeeReceiptType = z.infer<typeof ReverseFeeReceiptPayload>;
export type FeeStudentListQueryType = z.infer<typeof FeeStudentListQuery>;

export const UpdateFeeStructureStatusPayload = z.object({
  isActive: z.boolean({ error: "isActive must be true or false" }),
});

export type WaiveFeePaymentType = z.infer<typeof WaiveFeePaymentPayload>;

export type FeePaymentListQueryType = z.infer<typeof FeePaymentListQuery>;
export type UpdateFeeStructureStatusType = z.infer<
  typeof UpdateFeeStructureStatusPayload
>;

export type UpdateSchoolSettingsType = z.infer<
  typeof UpdateSchoolSettingsPayload
>;
export type FeesStructureType = z.infer<typeof FeesStructurePayload>;
export type FeesStructureUpdateType = z.infer<
  typeof FeesStructureUpdatePayload
>;

export type TeacherListPayload = Prisma.TeacherGetPayload<typeof TeacherList>;

export type StudentListPayload = Prisma.StudentGetPayload<typeof StudentList>;

export type ModeratorWithDetails = Prisma.AdminGetPayload<
  typeof moderatorWithDetails
>;

export type TeacherWithDetails = Prisma.TeacherGetPayload<
  typeof teacherWithDetails
>;

export type StudentWithDetails = Prisma.StudentGetPayload<
  typeof studentWithDetails
>;

export type StudentWithClassDetailsReturn = Prisma.EnrollmentGetPayload<
  typeof studentWithClassDetails
>;

export type UserPermissionWithDetails = Prisma.UserGetPayload<
  typeof userPermissionWithDetails
>;

export type LoginSchemaInput = z.infer<typeof LoginInputSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type SendResetPasswordInput = z.infer<typeof SendResetPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type AcademicYearInput = z.infer<typeof AcademicYearSchema>; // ✅ fixed name clash
export type ClassInput = z.infer<typeof ClassSchema>;
export type SubjectInput = z.infer<typeof SubjectSchema>;
export type CreateModeratorInput = z.infer<typeof ModeratorSchema>;
export type UpdateUserPermissionInput = z.infer<
  typeof UpdateUserPermissionSchema
>;
export type TeacherApplicationInput = z.infer<typeof TeacherApplicationSchema>;
export type ResubmitTeacherApplicationInput = z.infer<
  typeof ResubmitTeacherApplicationSchema
>;
export type AdmissionApplicationInput = z.infer<
  typeof AdmissionApplicationSchema
>;
export type ResubmitAdmissionApplicationInput = z.infer<
  typeof ResubmitAdmissionApplicationSchema
>;
export type RejectAdmissionApplicationInput = z.infer<
  typeof RejectAdmissionApplicationSchema
>;
export type CreateTimeTableInput = z.infer<
  typeof CreateTimeTableSchema
>[number];
export type UpdateTimeTableInput = z.infer<typeof UpdateTimeTableSchema>;
export type StudentAttendanceInput = z.infer<typeof StudentAttendanceSchema>;
export type TeacherAttendanceInput = z.infer<typeof TeacherAttendanceSchema>;
export type ModeratorAttendanceInput = z.infer<
  typeof ModeratorAttendanceSchema
>;
export type ExamScheduleInput = z.infer<typeof ExamScheduleSchema>;
export type MarksInput = z.infer<typeof MarksSchema>;
export type UpdateMarkInput = z.infer<typeof updateMarkSchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type ReviewLeaveRequestInput = z.infer<typeof reviewLeaveRequestSchema>;
export type CreateHolidayInput = z.infer<typeof CreateHolidaySchema>;
export type AssignTeacherToSubjectInput = z.infer<
  typeof AssignTeacherToSubjectSchema
>;
export type AssignClassTeacher = z.infer<typeof AssignClassTeacherSchema>;
export type DashboardCalendarQueryType = z.infer<typeof DashboardCalendarQuery>;
