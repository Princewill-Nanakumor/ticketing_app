import { describe, expect, it } from "vitest";
import {
  commentSchema,
  getTicketFieldErrors,
  ticketSchema,
} from "./schema";

describe("ticketSchema", () => {
  it("accepts a valid ticket", () => {
    const result = ticketSchema.safeParse({
      subject: "Printer issue",
      description: "Cannot print invoices today",
      priority: "High",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty subject", () => {
    const result = ticketSchema.safeParse({
      subject: "   ",
      description: "Cannot print invoices today",
      priority: "Low",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short description", () => {
    const result = ticketSchema.safeParse({
      subject: "Help",
      description: "Too short",
      priority: "Medium",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(getTicketFieldErrors(result.error).description).toBe(
        "Description must be at least 10 characters",
      );
    }
  });

  it("rejects invalid priority", () => {
    const result = ticketSchema.safeParse({
      subject: "Help please",
      description: "Something is broken here",
      priority: "Urgent",
    });
    expect(result.success).toBe(false);
  });
});

describe("commentSchema", () => {
  it("accepts a non-empty comment", () => {
    expect(commentSchema.safeParse({ body: "Looking into this." }).success).toBe(
      true,
    );
  });

  it("rejects blank comments", () => {
    const result = commentSchema.safeParse({ body: "   " });
    expect(result.success).toBe(false);
  });
});
