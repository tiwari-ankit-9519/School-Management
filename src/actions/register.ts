"use server";

import { registerFormSchema } from "@/types/authTypes";
import axios from "axios";
import { z } from "zod";

export const register = async (values: z.infer<typeof registerFormSchema>) => {
  const validatedFields = registerFormSchema.safeParse(values);
  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid fields",
    };
  }

  const response = await axios.post(
    "http://localhost:3000/api/auth/register",
    validatedFields.data
  );

  return response.data;
};
