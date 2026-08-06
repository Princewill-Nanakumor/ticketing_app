import { afterEach, describe, expect, it } from "vitest";
import { getAdminEmail, isAdminEmail } from "./admin";

describe("admin", () => {
  const original = process.env.ADMIN_EMAIL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ADMIN_EMAIL;
    } else {
      process.env.ADMIN_EMAIL = original;
    }
  });

  it("getAdminEmail returns lowercased trimmed email", () => {
    process.env.ADMIN_EMAIL = "  Admin@Example.COM ";
    expect(getAdminEmail()).toBe("admin@example.com");
  });

  it("getAdminEmail throws when unset", () => {
    delete process.env.ADMIN_EMAIL;
    expect(() => getAdminEmail()).toThrow("ADMIN_EMAIL is not set");
  });

  it("isAdminEmail matches case-insensitively", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    expect(isAdminEmail("ADMIN@example.com")).toBe(true);
    expect(isAdminEmail("  admin@example.com  ")).toBe(true);
    expect(isAdminEmail("other@example.com")).toBe(false);
  });

  it("isAdminEmail returns false when ADMIN_EMAIL is missing", () => {
    delete process.env.ADMIN_EMAIL;
    expect(isAdminEmail("admin@example.com")).toBe(false);
  });
});
