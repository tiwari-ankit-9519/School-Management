import { Gender } from "@/types";
import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Email or registration number is required" }),
  password: z
    .string()
    .min(6, { message: "Password should be at least 6 characters" })
    .max(20, { message: "Password must be at most 20 characters" }),
});

export const schoolApplicationFormSchema = z.object({
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
  establishedYear: z
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
});

export type SchoolApplicationFormData = z.infer<
  typeof schoolApplicationFormSchema
>;

export type LoginFormValue = z.infer<typeof loginSchema>;
