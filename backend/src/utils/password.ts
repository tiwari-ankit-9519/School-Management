import argon2 from "argon2";

if (
  !process.env.ARGON_MEMORY_COST ||
  !process.env.ARGON_TIME_COST ||
  !process.env.ARGON_PARALLELISM
) {
  throw new Error("Please provide the configuration for argon");
}

const memoryCost = parseInt(process.env.ARGON_MEMORY_COST || "65536", 10);
const timeCost = parseInt(process.env.ARGON_TIME_COST || "3", 10);
const parallelism = parseInt(process.env.ARGON_PARALLELISM || "4", 10);

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: memoryCost,
  timeCost: timeCost,
  parallelism: parallelism,
};

export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await argon2.hash(password, ARGON2_OPTIONS);
    return hash;
  } catch (error) {
    console.error("Password hashing error:", error);
    throw new Error("Failed to hash password");
  }
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}
