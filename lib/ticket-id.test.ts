import { describe, expect, it } from "vitest";
import { generateTicketId, isTicketId } from "./ticket-id";

describe("ticket-id", () => {
  it("generates IDs matching XX#######", () => {
    const id = generateTicketId();
    expect(id).toMatch(/^[A-Z]{2}\d{7}$/);
    expect(isTicketId(id)).toBe(true);
  });

  it("accepts valid ticket IDs", () => {
    expect(isTicketId("SB4826323")).toBe(true);
    expect(isTicketId("AU0000001")).toBe(true);
  });

  it("rejects invalid ticket IDs", () => {
    expect(isTicketId("")).toBe(false);
    expect(isTicketId("sb4826323")).toBe(false);
    expect(isTicketId("S4826323")).toBe(false);
    expect(isTicketId("SB482632")).toBe(false);
    expect(isTicketId("SB48263234")).toBe(false);
    expect(isTicketId("123456789")).toBe(false);
  });
});
