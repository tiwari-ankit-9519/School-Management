import { z } from "zod";

export const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password should be at least 6 characters")
    .max(20, "Password should be at most 20 characters"),
});
