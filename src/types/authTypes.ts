import { z } from "zod";

export const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password should be at least 6 characters")
    .max(20, "Password should be at most 20 characters"),
});

export const registerFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be of atleast 2 characters")
    .max(20, "Name must be of atleast 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password should be at least 6 characters")
    .max(20, "Password should be at most 20 characters"),
});
