import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/sentry", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/flash", () => ({
  setFlash: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/admin", () => ({
  isAdminEmail: vi.fn((email: string) => email === "admin@example.com"),
}));

vi.mock("@/lib/login-rate-limit", () => ({
  checkLoginRateLimit: vi.fn(() => ({ allowed: true, retryAfterSeconds: 0 })),
  recordFailedLogin: vi.fn(),
  clearLoginRateLimit: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  destroySession: vi.fn().mockResolvedValue(undefined),
  getCurrentUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) =>
      name.toLowerCase() === "x-forwarded-for" ? "203.0.113.50" : null,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as Error & { digest?: string }).digest =
      `NEXT_REDIRECT;replace;${url}`;
    throw error;
  }),
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue("hashed"),
  },
}));

import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordFailedLogin,
} from "@/lib/login-rate-limit";
import {
  createSession,
  destroySession,
  getCurrentUser,
} from "@/lib/current-user";
import { setFlash } from "@/lib/flash";
import { login, logout, register } from "./auth";

describe("register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation errors", async () => {
    const formData = new FormData();
    formData.set("name", "A");
    formData.set("email", "bad");
    formData.set("password", "weak");

    const result = await register({ success: false }, formData);

    expect(result.success).toBe(false);
    expect(
      result.errors?.name || result.errors?.email || result.errors?.password,
    ).toBeTruthy();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate emails", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "US1000001",
    } as never);

    const formData = new FormData();
    formData.set("name", "Ada Lovelace");
    formData.set("email", "ada@example.com");
    formData.set("password", "Password1!");

    const result = await register({ success: false }, formData);

    expect(result).toMatchObject({
      success: false,
      errors: { email: "An account with that email exists." },
    });
  });

  it("creates a USER account", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "US1000001",
      role: "USER",
    } as never);

    const formData = new FormData();
    formData.set("name", "Ada Lovelace");
    formData.set("email", "ada@example.com");
    formData.set("password", "Password1!");

    const result = await register({ success: false }, formData);

    expect(result.success).toBe(true);
    expect(bcrypt.hash).toHaveBeenCalledWith("Password1!", 10);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "ada@example.com",
          role: "USER",
          passwordHash: "hashed",
        }),
      }),
    );
  });

  it("assigns ADMIN when email matches admin email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "US1000002",
      role: "ADMIN",
    } as never);

    const formData = new FormData();
    formData.set("name", "Primary Admin");
    formData.set("email", "admin@example.com");
    formData.set("password", "Password1!");

    const result = await register({ success: false }, formData);

    expect(result.success).toBe(true);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "ADMIN" }),
      }),
    );
  });
});

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkLoginRateLimit).mockReturnValue({
      allowed: true,
      retryAfterSeconds: 0,
    });
  });

  it("rejects invalid form input", async () => {
    const formData = new FormData();
    formData.set("email", "not-email");
    formData.set("password", "");

    const result = await login({ success: false }, formData);
    expect(result.success).toBe(false);
  });

  it("blocks when rate limited", async () => {
    vi.mocked(checkLoginRateLimit).mockReturnValue({
      allowed: false,
      retryAfterSeconds: 42,
    });

    const formData = new FormData();
    formData.set("email", "user@example.com");
    formData.set("password", "Password1!");

    const result = await login({ success: false }, formData);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/42 seconds/);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("rejects bad credentials and records a failure", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("email", "user@example.com");
    formData.set("password", "Password1!");

    const result = await login({ success: false }, formData);

    expect(result.message).toBe("Invalid email or password.");
    expect(recordFailedLogin).toHaveBeenCalled();
  });

  it("creates a session and redirects on success", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "US1000001",
      email: "user@example.com",
      name: "User",
      role: "USER",
      passwordHash: "hash",
    } as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const formData = new FormData();
    formData.set("email", "user@example.com");
    formData.set("password", "Password1!");

    await expect(login({ success: false }, formData)).rejects.toThrow(
      /NEXT_REDIRECT:\/tickets/,
    );
    expect(clearLoginRateLimit).toHaveBeenCalled();
    expect(createSession).toHaveBeenCalledWith({
      id: "US1000001",
      email: "user@example.com",
      name: "User",
      role: "USER",
    });
    expect(setFlash).toHaveBeenCalledWith("signed_in");
  });
});

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("destroys the session and redirects to login", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "US1000001",
      email: "user@example.com",
      name: "User",
      role: "USER",
    } as never);

    await expect(logout()).rejects.toThrow(/NEXT_REDIRECT:\/login/);
    expect(destroySession).toHaveBeenCalled();
  });
});
