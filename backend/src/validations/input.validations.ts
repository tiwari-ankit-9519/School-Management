import { email, z } from "zod";
import {
  AttendanceStatus,
  DocumentType,
  Gender,
  Module,
  ParentType,
  Prisma,
} from "@prisma/client";

export const SchoolApplicationSchema = z.object({
  schoolName: z
    .string({ error: "School name is required" })
    .min(3, { error: "School name must be at least 3 characters" })
    .max(100, { error: "School name must be at most 100 characters" })
    .trim(),
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
  country: z
    .string({ error: "Country is required" })
    .min(2, { error: "Country must be at least 2 characters" })
    .max(50, { error: "Country must be at most 50 characters" })
    .trim(),
  pincode: z
    .string({ error: "Pincode is required" })
    .regex(/^\d{4,10}$/, { error: "Pincode must be 4 to 10 digits" }),
  phone: z
    .string({ error: "Phone number is required" })
    .regex(/^\+?[0-9]{7,15}$/, {
      error: "Phone number must be 7 to 15 digits and can start with +",
    }),
  email: z
    .string({ error: "Email is required" })
    .email({ error: "Invalid email address" })
    .max(100, { error: "Email must be at most 100 characters" })
    .toLowerCase()
    .trim(),
  website: z
    .string()
    .url({ error: "Website must be a valid URL" })
    .max(100, { error: "Website must be at most 100 characters" })
    .optional()
    .or(z.literal("")),
  establishedYear: z.coerce
    .number({ error: "Established year must be a number" })
    .int({ error: "Established year must be a whole number" })
    .min(1800, { error: "Established year must be after 1800" })
    .max(new Date().getFullYear(), {
      error: "Established year cannot be in the future",
    }),
  affiliationNumber: z
    .string()
    .trim()
    .refine((val) => val === "" || (val.length >= 3 && val.length <= 50), {
      message: "Affiliation number must be between 3 and 50 characters",
    })
    .optional(),
  boardType: z
    .string({ error: "Board type is required" })
    .min(2, { error: "Board type must be at least 2 characters" })
    .max(50, { error: "Board type must be at most 50 characters" })
    .trim(),
  adminFirstName: z
    .string({ error: "Admin first name is required" })
    .min(2, { error: "First name must be at least 2 characters" })
    .max(50, { error: "First name must be at most 50 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, {
      error:
        "First name can only contain letters, spaces, hyphens and apostrophes",
    })
    .trim(),
  adminLastName: z
    .string({ error: "Admin last name is required" })
    .min(2, { error: "Last name must be at least 2 characters" })
    .max(50, { error: "Last name must be at most 50 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, {
      error:
        "Last name can only contain letters, spaces, hyphens and apostrophes",
    })
    .trim(),
  adminEmail: z
    .string({ error: "Admin email is required" })
    .email({ error: "Invalid admin email address" })
    .max(100, { error: "Admin email must be at most 100 characters" })
    .toLowerCase()
    .trim(),
  adminPhone: z
    .string({ error: "Admin phone number is required" })
    .regex(/^\+?[0-9]{7,15}$/, {
      error: "Admin phone must be 7 to 15 digits and can start with +",
    }),
  adminGender: z.nativeEnum(Gender, {
    error: "Gender must be MALE, FEMALE or OTHER",
  }),
  documents: z
    .array(
      z.object({
        documentType: z.enum(DocumentType),
        title: z.string().min(2).max(100).trim(),
      }),
    )
    .optional(),
});

export const ReviewSchoolApplicationSchema = z.object({
  notes: z
    .string()
    .max(500, { error: "Notes must be at most 500 characters" })
    .trim()
    .optional(),
});

export const RejectSchoolApplicationSchema = z.object({
  rejectionReason: z
    .string({ error: "Rejection reason is required" })
    .min(10, { error: "Rejection reason must be at least 10 characters" })
    .max(500, { error: "Rejection reason must be at most 500 characters" })
    .trim(),
});

export const RejectTeacherApplicationSchema = z.object({
  rejectionReason: z
    .string({ error: "Rejection reason is required" })
    .min(10, { error: "Rejection reason must be at least 10 characters" })
    .max(500, { error: "Rejection reason must be at most 500 characters" })
    .trim(),
});

export const ResubmitApplicationSchema = z
  .object({
    affiliationNumber: z
      .string({ error: "Affiliation number must be a string" })
      .min(3, { error: "Affiliation number must be at least 3 characters" })
      .max(50, { error: "Affiliation number must be at most 50 characters" })
      .trim()
      .optional(),
    boardType: z
      .string({ error: "Board type must be a string" })
      .min(2, { error: "Board type must be at least 2 characters" })
      .max(50, { error: "Board type must be at most 50 characters" })
      .trim()
      .optional(),
    establishedYear: z.coerce
      .number({ error: "Established year must be a number" })
      .int({ error: "Established year must be a whole number" })
      .min(1800, { error: "Established year must be after 1800" })
      .max(new Date().getFullYear(), {
        error: "Established year cannot be in the future",
      })
      .optional(),
    website: z
      .string()
      .url({ error: "Website must be a valid URL" })
      .max(100, { error: "Website must be at most 100 characters" })
      .optional()
      .or(z.literal("")),
    phone: z
      .string({ error: "Phone number must be a string" })
      .regex(/^\+?[0-9]{7,15}$/, {
        error: "Phone must be 7 to 15 digits and can start with +",
      })
      .optional(),
    address: z
      .string({ error: "Address must be a string" })
      .min(10, { error: "Address must be at least 10 characters" })
      .max(200, { error: "Address must be at most 200 characters" })
      .trim()
      .optional(),
    pincode: z
      .string({ error: "Pincode must be a string" })
      .regex(/^\d{4,10}$/, { error: "Pincode must be 4 to 10 digits" })
      .optional(),
    adminEmail: z
      .string({ error: "Admin email must be a string" })
      .email({ error: "Invalid admin email address" })
      .max(100, { error: "Admin email must be at most 100 characters" })
      .toLowerCase()
      .trim()
      .optional(),
    adminPhone: z
      .string({ error: "Admin phone must be a string" })
      .regex(/^\+?[0-9]{7,15}$/, {
        error: "Admin phone must be 7 to 15 digits and can start with +",
      })
      .optional(),
    documents: z
      .array(
        z.object({
          documentType: z.nativeEnum(DocumentType, {
            error: "Invalid document type",
          }),
          title: z
            .string({ error: "Document title must be a string" })
            .min(2, { error: "Document title must be at least 2 characters" })
            .max(100, {
              error: "Document title must be at most 100 characters",
            })
            .trim(),
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

export const RequestMoreInfoSchema = z.object({
  notes: z
    .string({ error: "Notes are required" })
    .min(10, { error: "Notes must be at least 10 characters" })
    .max(500, { error: "Notes must be at most 500 characters" })
    .trim(),
  moreInfoFields: z
    .array(
      z.enum(
        [
          "website",
          "affiliationNumber",
          "phone",
          "address",
          "pincode",
          "adminPhone",
          "documents",
          "schoolName",
          "city",
          "state",
          "country",
        ],
        { error: "Invalid field specified" },
      ),
    )
    .min(1, { error: "At least one field must be specified" })
    .max(10, { error: "At most 10 fields can be specified" }),
});

export const LoginInputSchema = z
  .object({
    email: z.string().email({ error: "Please provide valid email" }).optional(),
    regNumber: z.string().optional(),
    password: z.string({ error: "Password is required" }),
  })
  .refine((data) => data.email || data.regNumber, {
    message: "Either email or registration number is required",
  });

export const AcademicYearInput = z
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
        {
          error: "Duplicate modules are not allowed",
        },
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
    {
      error: "Teaching details are required when isTeacher is true",
    },
  );

export const moderatorWithDetails = Prisma.validator<Prisma.AdminDefaultArgs>()(
  {
    include: {
      user: {
        select: {
          id: true,
          regNumber: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      },
      permissions: true,
    },
  },
);

export const teacherWithDeatils = Prisma.validator<Prisma.TeacherDefaultArgs>()(
  {
    include: {
      user: {
        select: {
          id: true,
          regNumber: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      },
    },
  },
);

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
  documents: z
    .array(
      z.object({
        documentType: z.enum(DocumentType),
        title: z.string().min(2).max(100).trim(),
      }),
    )
    .optional(),
});

const classGrade = z.union([
  z.string().regex(/^([1-9]|1[0-2])$/, {
    error: "Class must be a number between 1 and 12",
  }),
  z.enum(["KG", "LKG", "UKG", "Nursery"], {
    error:
      "Class must be one of: KG, LKG, UKG, Nursery or a number between 1-12",
  }),
]);

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
    gender: z.enum(Gender, {
      error: "Gender is required",
    }),
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
    previousSchool: z
      .string()
      .trim()
      .min(2, { error: "Previous school name should be at least 2 characters" })
      .max(100, {
        error: "Previous school name should be at most 100 characters",
      })
      .optional(),
    previousClass: classGrade.optional(),
    appliedForClass: classGrade,
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
    guardianEmail: z
      .string()
      .trim()
      .email({ error: "Invalid email address" })
      .optional(),
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

export const studentWithDetails = Prisma.validator<Prisma.StudentDefaultArgs>()(
  {
    include: {
      user: {
        select: {
          id: true,
          regNumber: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      },
      parent: {
        select: {
          id: true,
          userId: true,
          studentId: true,
          firstName: true,
          lastName: true,
          parentType: true,
          alternatePhone: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      enrollments: {
        select: {
          id: true,
          classId: true,
          academicYearId: true,
          rollNumber: true,
          status: true,
          enrolledAt: true,
        },
      },
    },
  },
);

export const AssignTeacherToSubjectSchema = z.object({
  teacherId: z.string({ error: "Teacher ID is required" }),
  classId: z.string({ error: "Class ID is required" }),
});

export const AssignClassTeacherSchema = z.object({
  teacherId: z.string({ error: "Teacher ID is required" }),
  classId: z.string({ error: "Class ID is required" }),
});

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

export const ModeratorAttendanceSchema = z.object({
  date: z.iso.date(),
  attendance: z.array(
    z.object({
      moderatorId: z.string({ error: "Moderator ID is required" }),
      status: z.enum(AttendanceStatus),
    }),
  ),
});

// Types export

export type ModeratorAttendanceInput = z.infer<
  typeof ModeratorAttendanceSchema
>;

export type CreateTimeTableInput = z.infer<
  typeof CreateTimeTableSchema
>[number];

export type StudentAttendanceInput = z.infer<typeof StudentAttendanceSchema>;
export type TeacherAttendanceInput = z.infer<typeof TeacherAttendanceSchema>;

export type UpdateTimeTableInput = z.infer<typeof UpdateTimeTableSchema>;

export type AssignTeacherToSubjectInput = z.infer<
  typeof AssignTeacherToSubjectSchema
>;
export type AssignClassTeacher = z.infer<typeof AssignClassTeacherSchema>;

export type ModeratorWithDetails = Prisma.AdminGetPayload<
  typeof moderatorWithDetails
>;

export type StudentWithDetails = Prisma.StudentGetPayload<
  typeof studentWithDetails
>;

export type TeacherWithDetails = Prisma.TeacherGetPayload<
  typeof teacherWithDeatils
>;

export type ResubmitAdmissionApplicationInput = z.infer<
  typeof ResubmitAdmissionApplicationSchema
>;

export type RejectAdmissionApplicationInput = z.infer<
  typeof RejectAdmissionApplicationSchema
>;
export type AdmissionApplicationInput = z.infer<
  typeof AdmissionApplicationSchema
>;
export type ResubmitTeacherApplicationInput = z.infer<
  typeof ResubmitTeacherApplicationSchema
>;
export type TeacherApplicationInput = z.infer<typeof TeacherApplicationSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type SendResetPasswordInput = z.infer<typeof SendResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type CreateModeratorInput = z.infer<typeof ModeratorSchema>;
export type SubjectInput = z.infer<typeof SubjectSchema>;
export type ClassInput = z.infer<typeof ClassSchema>;
export type AcademicYearInput = z.infer<typeof AcademicYearInput>;
export type LoginSchemaInput = z.infer<typeof LoginInputSchema>;
export type RequestMoreInfoInput = z.infer<typeof RequestMoreInfoSchema>;
export type ResubmitApplicationInput = z.infer<
  typeof ResubmitApplicationSchema
>;
export type SchoolApplicationInput = z.infer<typeof SchoolApplicationSchema>;
export type ReviewSchoolApplicationInput = z.infer<
  typeof ReviewSchoolApplicationSchema
>;
export type RejectSchoolApplicationInput = z.infer<
  typeof RejectSchoolApplicationSchema
>;

export type RejectTeacherApplicationInput = z.infer<
  typeof RejectTeacherApplicationSchema
>;
