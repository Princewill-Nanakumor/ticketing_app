import { describe, expect, it } from "vitest";
import { getPriorityClass } from "./utils";

describe("getPriorityClass", () => {
  it("maps known priorities", () => {
    expect(getPriorityClass("High")).toBe("text-red-600 font-bold");
    expect(getPriorityClass("Medium")).toBe("text-yellow-600 font-bold");
    expect(getPriorityClass("Low")).toBe("text-green-600 font-bold");
  });

  it("falls back for unknown priority", () => {
    expect(getPriorityClass("Urgent")).toBe("text-sage");
  });
});
