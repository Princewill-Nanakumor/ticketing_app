import { describe, expect, it } from "vitest";
import {
  getAuthFieldErrors,
  getMissingPasswordRequirements,
  getPasswordHint,
  isPasswordValid,
  loginSchema,
  passwordSchema,
  registerSchema,
} from "./auth-schema";

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Password1!").success).toBe(true);
    expect(isPasswordValid("Password1!")).toBe(true);
  });

  it("rejects passwords that are too short", () => {
    const result = passwordSchema.safeParse("Pass1!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords that do not start with a capital", () => {
    const result = passwordSchema.safeParse("password1!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords missing a number", () => {
    const result = passwordSchema.safeParse("Password!");
    expect(result.success).toBe(false);
  });

  it("rejects passwords missing a special character", () => {
    const result = passwordSchema.safeParse("Password1");
    expect(result.success).toBe(false);
  });
});

describe("getMissingPasswordRequirements / getPasswordHint", () => {
  it("lists missing requirements", () => {
    expect(getMissingPasswordRequirements("abc")).toEqual(
      expect.arrayContaining([
        "begin with a capital letter",
        "be at least 8 characters",
        "include a number",
        "include a special character",
      ]),
    );
  });

  it("returns null hint when password is valid", () => {
    expect(getPasswordHint("Password1!")).toBeNull();
  });

  it("formats a single missing requirement", () => {
    expect(getPasswordHint("Password1")).toBe(
      "Password must include a special character.",
    );
  });
});

describe("loginSchema", () => {
  it("accepts valid credentials shape", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "x",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Password1!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short names", () => {
    const result = registerSchema.safeParse({
      name: "A",
      email: "ada@example.com",
      password: "Password1!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getAuthFieldErrors(result.error).name).toBe(
        "Name must be at least 2 characters",
      );
    }
  });
});
