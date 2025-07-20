import prisma from "@/lib/prismaSetup";
import { signUpSchema } from "@/lib/zod";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = await signUpSchema.parseAsync(body);

    const userExists = await prisma.admin.findUnique({
      where: {
        email,
      },
    });

    if (userExists) {
      return NextResponse.json(
        {
          status: "error",
          statusCode: 409,
          message:
            "User exists with the email address. Please try a different email address",
        },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        status: "success",
        statusCode: 201,
        message: "User created successfully!",
        data: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          status: "error",
          statusCode: 400,
          message: "Validation failed",
          errors: error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        statusCode: 500,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
