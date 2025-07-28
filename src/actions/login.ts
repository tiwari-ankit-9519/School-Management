"use server";

import { signIn } from "@/lib/auth";
import { formSchema } from "@/types/authTypes";
import { z } from "zod";

export async function login(values: z.infer<typeof formSchema>) {
  try {
    const validatedFields = formSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid fields",
      };
    }

    const { email, password } = validatedFields.data;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false,
        message: "Invalid credentials",
      };
    }

    return {
      success: true,
      message: "Login successful",
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}
