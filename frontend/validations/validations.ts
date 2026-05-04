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

export type LoginFormValue = z.infer<typeof loginSchema>;
