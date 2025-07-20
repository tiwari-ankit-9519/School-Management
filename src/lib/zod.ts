import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Invalid email. Please provide correct email"),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});

export const signUpSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(2, "Name must be of atleast 2 characters")
    .max(32, "Name must be of atmost 32 characters"),
  email: z.email("Invalid email. Please provide correct email"),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required")
    .min(8, "Password must be more than 8 characters")
    .max(32, "Password must be less than 32 characters"),
});
