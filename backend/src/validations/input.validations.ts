import { email, z } from "zod";
import { DocumentType, Gender } from "@prisma/client";

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
        documentType: z.nativeEnum(DocumentType),
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
