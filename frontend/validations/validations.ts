import { z } from "zod";
import {
  Gender,
  ParentType,
  DocumentType,
  ExamType,
  AttendanceStatus,
  LeaveStatus,
  Module,
} from "@/types";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const enumValues = <T extends Record<string, string>>(e: T) =>
  Object.values(e) as [string, ...string[]];

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

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Email or registration number is required" }),
  password: z
    .string()
    .min(6, { message: "Password should be at least 6 characters" })
    .max(20, { message: "Password must be at most 20 characters" }),
});

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(6, { error: "Minimum 6 digit password is required" })
    .max(20, { error: "Password can be of maximum 20 digits" }),
  newPassword: z
    .string()
    .min(6, { error: "Minimum 6 digit password is required" })
    .max(20, { error: "Password can be of maximum 20 digits" }),
});

export const sendResetPasswordSchema = z
  .object({
    email: z.string().email({ error: "Please provide valid email" }).optional(),
    regNumber: z.string().optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/, {
        error: "Phone number must be 7 to 15 digits and can start with +",
      })
      .optional(),
  })
  .refine((data) => data.email || data.regNumber || data.phone, {
    error: "Either email, registration number or phone is required",
  });

export const resetPasswordSchema = z
  .object({
    email: z.string().email({ error: "Please provide valid email" }).optional(),
    regNumber: z.string().optional(),
    token: z.string({ error: "Token is required" }),
    newPassword: z
      .string()
      .min(6, { error: "Minimum 6 digit password is required" })
      .max(20, { error: "Password can be of maximum 20 digits" }),
  })
  .refine((data) => data.email || data.regNumber, {
    error: "Either email or registration number is required",
  });

// ─────────────────────────────────────────────
// ACADEMIC YEAR
// ─────────────────────────────────────────────

export const academicYearSchema = z
  .object({
    name: z
      .string()
      .min(3, { error: "Name should be of atleast 3 characters" })
      .max(10, { error: "Name should be of max 10 characters" })
      .regex(/^\d{4}-\d{2,4}$/, {
        error: "Name should be in format 2024-25 or 2024-2025",
      })
      .trim(),
    startDate: z.string().date({ message: "Start date is required" }),
    endDate: z.string().date({ message: "End date is required" }),
    isCurrent: z.boolean(), // ✅ not z.coerce.boolean()
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    error: "End date must be after start date",
    path: ["endDate"],
  });

// ─────────────────────────────────────────────
// CLASS & SUBJECT
// ─────────────────────────────────────────────

export const classSchema = z.object({
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
  capacity: z
    .number({ error: "Capacity must be a number" })
    .min(10, { error: "Minimum capacity is 10" })
    .max(50, {
      error: "Maximum of 50 students can be enrolled in a single class",
    }),
  roomNumber: z.string().optional().or(z.literal("")),
  // .transform((val) => (val === "" ? null : val)),
});

export const subjectSchema = z.object({
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

// ─────────────────────────────────────────────
// PERMISSIONS & MODERATOR
// ─────────────────────────────────────────────

export const modulePermissionSchema = z.object({
  module: z.enum(enumValues(Module)),
  canCreate: z.boolean().default(false),
  canRead: z.boolean().default(true),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canApprove: z.boolean().default(false),
  canExport: z.boolean().default(false),
});

export const moderatorSchema = z
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
    gender: z.enum(enumValues(Gender)),
    dateOfBirth: z.coerce
      .date({ error: "Date is required" })
      .refine((date) => date < new Date(), {
        error: "Date of birth should be in past",
      }) as z.ZodType<Date>,
    email: z.string().email({ error: "Please provide a valid email address" }),
    phone: z.string().regex(/^\+?[0-9]{7,15}$/, {
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
        (perms) => new Set(perms.map((p) => p.module)).size === perms.length,
        { error: "Duplicate modules are not allowed" },
      ),
    isTeacher: z.boolean().default(false),
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

export const updateUserPermissionSchema = z.object({
  userId: z.string().min(1, { error: "User ID is required" }),
  permissions: z
    .array(modulePermissionSchema)
    .min(1, { error: "At least 1 module permission is required" })
    .refine(
      (perms) => new Set(perms.map((p) => p.module)).size === perms.length,
      { error: "Duplicate modules are not allowed" },
    ),
});

// ─────────────────────────────────────────────
// TEACHER APPLICATION
// ─────────────────────────────────────────────

export const teacherApplicationSchema = z.object({
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
  email: z.string().email({ error: "Please provide a valid email address" }),
  phone: z
    .string({ error: "Phone number is required" })
    .regex(/^\+?[0-9]{7,15}$/, {
      error: "Phone number must be 7 to 15 digits and can start with +",
    }),
  gender: z.enum(enumValues(Gender)),
  dateOfBirth: z
    .date({ error: "Date is required" })
    .refine((date) => date < new Date(), {
      error: "Date of birth should be in past",
    }) as z.ZodType<Date>,
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
  qualification: z
    .string({ error: "Qualification details are required" })
    .trim()
    .min(2, { error: "Qualification should be of atleast 2 characters" })
    .max(40, { error: "Qualification should be of atmost 40 characters" }),
  experience: z.number({ error: "Experience is required" }),
  specialization: z.string().optional(),
  photoUrl: z.string().url().optional(),
  documents: z
    .array(
      z.object({
        documentType: z.enum(enumValues(DocumentType)),
        title: z.string().min(2).max(100).trim(),
      }),
    )
    .optional(),
});

export const resubmitTeacherApplicationSchema = z
  .object({
    specialization: z.string().optional(),
    documents: z
      .array(
        z.object({
          documentType: z.enum(enumValues(DocumentType)),
          title: z.string().min(2).max(100).trim(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => {
      const { documents, ...rest } = data;
      const hasFields = Object.values(rest).some((v) => v !== undefined);
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

export const admissionApplicationSchema = z
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
    gender: z.enum(enumValues(Gender), { error: "Gender is required" }),
    dateOfBirth: z.coerce
      .date({ error: "Date of birth is required" })
      .refine((date) => date < new Date(), {
        error: "Date of birth should be in the past",
      }) as z.ZodType<Date>,
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
    guardianRelation: z.enum(enumValues(ParentType), {
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
          documentType: z.enum(enumValues(DocumentType)),
          title: z.string().min(2).max(100).trim(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => !(data.previousClass !== undefined && !data.previousSchool),
    {
      error: "Previous school name is required when previous class is provided",
      path: ["previousSchool"],
    },
  )
  .refine(
    (data) =>
      !(data.previousSchool !== undefined && data.previousClass === undefined),
    {
      error: "Previous class is required when previous school is provided",
      path: ["previousClass"],
    },
  );

export const resubmitAdmissionApplicationSchema = z
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
          documentType: z.enum(enumValues(DocumentType)),
          title: z.string().min(2).max(100).trim(),
        }),
      )
      .optional(),
  })
  .refine(
    (data) => !(data.previousClass !== undefined && !data.previousSchool),
    {
      error: "Previous school name is required when previous class is provided",
      path: ["previousSchool"],
    },
  )
  .refine(
    (data) =>
      !(data.previousSchool !== undefined && data.previousClass === undefined),
    {
      error: "Previous class is required when previous school is provided",
      path: ["previousClass"],
    },
  );

export const rejectAdmissionApplicationSchema = z.object({
  rejectionReason: z
    .string({ error: "Rejection reason is required" })
    .min(10, { error: "Rejection reason must be at least 10 characters" })
    .max(500, { error: "Rejection reason must be at most 500 characters" })
    .trim(),
});

// ─────────────────────────────────────────────
// TIMETABLE
// ─────────────────────────────────────────────

export const createTimetableSchema = z.array(
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

export const updateTimetableSchema = z.object({
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

export const studentAttendanceSchema = z.object({
  date: z.string().date(),
  attendance: z.array(
    z.object({
      studentId: z.string({ error: "Student ID is required" }),
      status: z.enum(enumValues(AttendanceStatus)),
    }),
  ),
});

export const teacherAttendanceSchema = z.object({
  date: z.string().date(),
  attendance: z.array(
    z.object({
      teacherId: z.string({ error: "Teacher ID is required" }),
      status: z.enum(enumValues(AttendanceStatus)),
    }),
  ),
});

export const moderatorAttendanceSchema = z.object({
  date: z.string().date(),
  attendance: z.array(
    z.object({
      moderatorId: z.string({ error: "Moderator ID is required" }),
      status: z.enum(enumValues(AttendanceStatus)),
    }),
  ),
});

// ─────────────────────────────────────────────
// EXAM & MARKS
// ─────────────────────────────────────────────

export const examScheduleSchema = z.object({
  examType: z.enum(enumValues(ExamType)),
  title: z.string({ error: "Title is required" }),
  date: z.string().date(),
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

export const marksSchema = z
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
    fromDate: z.string().date("Invalid date format, expected YYYY-MM-DD"),
    toDate: z.string().date("Invalid date format, expected YYYY-MM-DD"),
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
    status: z.enum(enumValues(LeaveStatus)),
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

export const createHolidaySchema = z.object({
  name: z.string({ error: "Name is required" }),
  date: z.string().date("Date is required"),
});

// ─────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────

export const assignTeacherToSubjectSchema = z.object({
  teacherId: z.string({ error: "Teacher ID is required" }),
  classId: z.string().optional(),
});

export const assignClassTeacherSchema = z.object({
  teacherId: z.string({ error: "Teacher ID is required" }),
  classId: z.string({ error: "Class ID is required" }),
});

// ─────────────────────────────────────────────
// INFERRED FORM VALUE TYPES
// ─────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export type SendResetPasswordFormValues = z.infer<
  typeof sendResetPasswordSchema
>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type AcademicYearFormValues = z.infer<typeof academicYearSchema>;
export type ClassFormValues = z.infer<typeof classSchema>;
export type SubjectFormValues = z.infer<typeof subjectSchema>;
export type CreateModeratorFormValues = z.infer<typeof moderatorSchema>;
export type UpdateUserPermissionFormValues = z.infer<
  typeof updateUserPermissionSchema
>;
export type TeacherApplicationFormValues = z.infer<
  typeof teacherApplicationSchema
>;
export type ResubmitTeacherApplicationFormValues = z.infer<
  typeof resubmitTeacherApplicationSchema
>;
export type AdmissionApplicationFormValues = z.infer<
  typeof admissionApplicationSchema
>;
export type ResubmitAdmissionApplicationFormValues = z.infer<
  typeof resubmitAdmissionApplicationSchema
>;
export type RejectAdmissionApplicationFormValues = z.infer<
  typeof rejectAdmissionApplicationSchema
>;
export type CreateTimetableFormValues = z.infer<
  typeof createTimetableSchema
>[number];
export type UpdateTimetableFormValues = z.infer<typeof updateTimetableSchema>;
export type StudentAttendanceFormValues = z.infer<
  typeof studentAttendanceSchema
>;
export type TeacherAttendanceFormValues = z.infer<
  typeof teacherAttendanceSchema
>;
export type ModeratorAttendanceFormValues = z.infer<
  typeof moderatorAttendanceSchema
>;
export type ExamScheduleFormValues = z.infer<typeof examScheduleSchema>;
export type MarksFormValues = z.infer<typeof marksSchema>;
export type UpdateMarkFormValues = z.infer<typeof updateMarkSchema>;
export type CreateLeaveRequestFormValues = z.infer<
  typeof createLeaveRequestSchema
>;
export type ReviewLeaveRequestFormValues = z.infer<
  typeof reviewLeaveRequestSchema
>;
export type CreateHolidayFormValues = z.infer<typeof createHolidaySchema>;
export type AssignTeacherToSubjectFormValues = z.infer<
  typeof assignTeacherToSubjectSchema
>;
export type AssignClassTeacherFormValues = z.infer<
  typeof assignClassTeacherSchema
>;
