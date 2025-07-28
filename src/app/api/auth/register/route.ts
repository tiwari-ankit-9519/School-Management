import prisma from "@/lib/prismaSetup";
import { signUpSchema } from "@/lib/zod";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({
        status: "error",
        message: "Something went wrong",
      });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({
        status: "error",
        message: error,
      });
    }
  }
}
