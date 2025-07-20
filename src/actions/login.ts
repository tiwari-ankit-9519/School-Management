"use server";

import { signIn } from "@/lib/auth";
import { formSchema } from "@/types/loginTypes";
import { z } from "zod";

export const login = async (values: z.infer<typeof formSchema>) => {
  const validatedFields = formSchema.safeParse(values);
  if (!validatedFields.success) {
    throw new Error("Validation failed");
  }

  const { email, password } = validatedFields.data;

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/",
  });
};
