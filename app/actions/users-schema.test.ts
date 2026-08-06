import { describe, expect, it } from "vitest";
import {
  getUpdateUserFieldErrors,
  updateUserSchema,
} from "./users-schema";

describe("updateUserSchema", () => {
  it("accepts valid updates without password", () => {
    const result = updateUserSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      role: "USER",
      password: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid roles", () => {
    const result = updateUserSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      role: "SUPER",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getUpdateUserFieldErrors(result.error).role).toBeTruthy();
    }
  });

  it("validates optional password when provided", () => {
    const result = updateUserSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      role: "USER",
      password: "weak",
    });
    expect(result.success).toBe(false);
  });
});
