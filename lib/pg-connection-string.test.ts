import { describe, expect, it } from "vitest";
import { pgConnectionString } from "./pg-connection-string";

describe("pgConnectionString", () => {
  it("rewrites deprecated ssl modes to verify-full", () => {
    expect(
      pgConnectionString(
        "postgresql://user:pass@host/db?sslmode=require",
      ),
    ).toBe("postgresql://user:pass@host/db?sslmode=verify-full");
    expect(
      pgConnectionString("postgresql://user:pass@host/db?sslmode=prefer"),
    ).toBe("postgresql://user:pass@host/db?sslmode=verify-full");
    expect(
      pgConnectionString(
        "postgresql://user:pass@host/db?sslmode=verify-ca",
      ),
    ).toBe("postgresql://user:pass@host/db?sslmode=verify-full");
  });

  it("leaves other connection strings unchanged", () => {
    expect(
      pgConnectionString(
        "postgresql://user:pass@host/db?sslmode=verify-full",
      ),
    ).toBe("postgresql://user:pass@host/db?sslmode=verify-full");
    expect(pgConnectionString("postgresql://user:pass@host/db")).toBe(
      "postgresql://user:pass@host/db",
    );
  });
});
