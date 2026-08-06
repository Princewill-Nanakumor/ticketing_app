import { describe, expect, it } from "vitest";
import { generateUserId, isUserId } from "./user-id";

describe("user-id", () => {
  it("generates IDs matching XX#######", () => {
    const id = generateUserId();
    expect(id).toMatch(/^[A-Z]{2}\d{7}$/);
    expect(isUserId(id)).toBe(true);
  });

  it("accepts valid user IDs", () => {
    expect(isUserId("US1234567")).toBe(true);
  });

  it("rejects invalid user IDs", () => {
    expect(isUserId("user-1")).toBe(false);
    expect(isUserId("US123")).toBe(false);
    expect(isUserId("us1234567")).toBe(false);
  });
});
