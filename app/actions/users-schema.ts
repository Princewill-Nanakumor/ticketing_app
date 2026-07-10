import { z } from "zod";
import { passwordSchema } from "@/app/actions/auth-schema";

export const updateUserSchema = z.object({
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
  role: z.enum(["USER", "ADMIN"], {
    error: "Select a valid role",
  }),
  password: z
    .string()
    .max(100, "Password must be 100 characters or fewer")
    .refine(
      (value) => value.length === 0 || passwordSchema.safeParse(value).success,
      "Password must be at least 8 characters, begin with a capital letter, and include a number and a special character",
    )
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type UpdateUserFieldErrors = Partial<
  Record<"name" | "email" | "role" | "password" | "form", string | undefined>
>;

export type UpdateUserState = {
  success: boolean;
  message?: string;
  errors?: UpdateUserFieldErrors;
};

export const initialUpdateUserState: UpdateUserState = {
  success: false,
};

export function getUpdateUserFieldErrors(
  error: z.ZodError,
): UpdateUserFieldErrors {
  const fieldErrors = error.flatten().fieldErrors as Partial<
    Record<"name" | "email" | "role" | "password", string[] | undefined>
  >;

  return {
    name: fieldErrors.name?.[0],
    email: fieldErrors.email?.[0],
    role: fieldErrors.role?.[0],
    password: fieldErrors.password?.[0],
  };
}
