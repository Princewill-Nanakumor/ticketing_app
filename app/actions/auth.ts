"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/sentry";
import { isAdminEmail } from "@/lib/admin";
import { generateUserId } from "@/lib/user-id";
import {
  createSession,
  destroySession,
  getCurrentUser,
} from "@/lib/current-user";
import {
  clearLoginRateLimit,
  checkLoginRateLimit,
  recordFailedLogin,
} from "@/lib/login-rate-limit";
import { setFlash } from "@/lib/flash";
import { headers } from "next/headers";
import type { AuthState } from "@/app/actions/auth-state";
import {
  getAuthFieldErrors,
  loginSchema,
  registerSchema,
} from "@/app/actions/auth-schema";

async function getRequestIp() {
  const headerStore = await headers();
  return (
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown"
  );
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function createUserWithUniqueId(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: "USER" | "ADMIN";
}) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = generateUserId();

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    try {
      return await prisma.user.create({
        data: {
          id,
          ...data,
        },
      });
    } catch (error) {
      lastError = error;

      if (isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Could not generate a unique user ID");
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors above.",
      errors: getAuthFieldErrors(parsed.error),
    };
  }

  const email = parsed.data.email.toLowerCase();
  const { password } = parsed.data;
  const ip = await getRequestIp();
  const rate = checkLoginRateLimit(email, ip);

  if (!rate.allowed) {
    await logEvent(
      "Login rate limit hit",
      "auth.login",
      { email, retryAfterSeconds: rate.retryAfterSeconds },
      "warning",
    );
    return {
      success: false,
      message: `Too many login attempts. Try again in ${rate.retryAfterSeconds} seconds.`,
      errors: {
        form: `Too many login attempts. Try again in ${rate.retryAfterSeconds} seconds.`,
      },
    };
  }

  let user;
  try {
    user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
  } catch (error) {
    await logEvent("Login DB lookup failed", "auth.login", { email }, "error", error);
    return {
      success: false,
      message: "Could not log in. Please try again.",
    };
  }

  let passwordMatches = false;
  try {
    passwordMatches = Boolean(
      user && (await bcrypt.compare(password, user.passwordHash)),
    );
  } catch (error) {
    await logEvent(
      "Login password compare failed",
      "auth.login",
      { email },
      "error",
      error,
    );
    return {
      success: false,
      message: "Could not log in. Please try again.",
    };
  }

  if (!user || !passwordMatches) {
    recordFailedLogin(email, ip);
    await logEvent(
      "Failed login attempt",
      "auth.login",
      { email },
      "warning",
    );
    return {
      success: false,
      message: "Invalid email or password.",
      errors: { form: "Invalid email or password." },
    };
  }

  clearLoginRateLimit(email, ip);

  try {
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    await logEvent(
      "Login session create failed",
      "auth.login",
      { email, userId: user.id },
      "error",
      error,
    );
    return {
      success: false,
      message: "Could not create your session. Check AUTH_SECRET and try again.",
    };
  }

  await logEvent(
    "User logged in",
    "auth.login",
    { userId: user.id, role: user.role },
    "info",
  );

  await setFlash("signed_in");
  redirect("/tickets");
}

export async function register(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the errors above.",
      errors: getAuthFieldErrors(parsed.error),
    };
  }

  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();
  const { password } = parsed.data;
  const role = isAdminEmail(email) ? "ADMIN" : "USER";

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return {
        success: false,
        message: "An account with that email exists.",
        errors: { email: "An account with that email exists." },
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUserWithUniqueId({
      name,
      email,
      passwordHash,
      role,
    });

    await logEvent(
      "User registered",
      "auth.register",
      { userId: user.id, role: user.role },
      "info",
    );

    return {
      success: true,
      message: "Account created successfully. Redirecting you to sign in…",
    };
  } catch (error) {
    await logEvent(
      "Registration failed",
      "auth.register",
      { email },
      "error",
      error,
    );
    return {
      success: false,
      message: "Could not create your account. Please try again.",
    };
  }
}

export async function logout() {
  const user = await getCurrentUser();
  await destroySession();

  if (user) {
    await logEvent(
      "User logged out",
      "auth.logout",
      { userId: user.id },
      "info",
    );
  }

  redirect("/login");
}
