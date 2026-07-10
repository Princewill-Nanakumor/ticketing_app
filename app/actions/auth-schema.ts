import { z } from "zod";

const HAS_LETTER = /[A-Za-z]/;
const HAS_NUMBER = /\d/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;
const STARTS_WITH_CAPITAL = /^[A-Z]/;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be 100 characters or fewer")
  .refine(
    (value) => STARTS_WITH_CAPITAL.test(value),
    "Password must begin with a capital letter",
  )
  .refine((value) => HAS_LETTER.test(value), "Password must include a letter")
  .refine((value) => HAS_NUMBER.test(value), "Password must include a number")
  .refine(
    (value) => HAS_SPECIAL.test(value),
    "Password must include a special character",
  );

export function getMissingPasswordRequirements(password: string) {
  const missing: string[] = [];

  // Capital-first rule always leads the message when unmet.
  if (!STARTS_WITH_CAPITAL.test(password)) {
    missing.push("begin with a capital letter");
  }

  if (password.length < 8) {
    missing.push("be at least 8 characters");
  }

  if (!HAS_LETTER.test(password)) {
    missing.push("include a letter");
  }

  if (!HAS_NUMBER.test(password)) {
    missing.push("include a number");
  }

  if (!HAS_SPECIAL.test(password)) {
    missing.push("include a special character");
  }

  return missing;
}

export function getPasswordHint(password: string) {
  const missing = getMissingPasswordRequirements(password);

  if (missing.length === 0) {
    return null;
  }

  if (missing.length === 1) {
    return `Password must ${missing[0]}.`;
  }

  if (missing.length === 2) {
    return `Password must ${missing[0]} and ${missing[1]}.`;
  }

  const last = missing[missing.length - 1];
  const rest = missing.slice(0, -1).join(", ");
  return `Password must ${rest}, and ${last}.`;
}

export function isPasswordValid(password: string) {
  return passwordSchema.safeParse(password).success;
}

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be 80 characters or fewer"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .min(1, "Email is required"),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export type AuthFieldErrors = Partial<
  Record<"name" | "email" | "password" | "form", string | undefined>
>;

export function getAuthFieldErrors(error: z.ZodError): AuthFieldErrors {
  const fieldErrors = error.flatten().fieldErrors as Partial<
    Record<"name" | "email" | "password", string[] | undefined>
  >;

  return {
    name: fieldErrors.name?.[0],
    email: fieldErrors.email?.[0],
    password: fieldErrors.password?.[0],
  };
}
