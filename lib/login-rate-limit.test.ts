import { describe, expect, it } from "vitest";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordFailedLogin,
} from "./login-rate-limit";

describe("login-rate-limit", () => {
  it("allows first attempts and blocks after 5 failures", () => {
    const email = `rate-limit-${Date.now()}@example.com`;
    const ip = "203.0.113.10";

    clearLoginRateLimit(email, ip);

    expect(checkLoginRateLimit(email, ip).allowed).toBe(true);

    for (let i = 0; i < 5; i += 1) {
      recordFailedLogin(email, ip);
    }

    const blocked = checkLoginRateLimit(email, ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("clears the limit after a successful clear", () => {
    const email = `rate-clear-${Date.now()}@example.com`;
    const ip = "203.0.113.11";

    for (let i = 0; i < 5; i += 1) {
      recordFailedLogin(email, ip);
    }

    expect(checkLoginRateLimit(email, ip).allowed).toBe(false);

    clearLoginRateLimit(email, ip);
    expect(checkLoginRateLimit(email, ip).allowed).toBe(true);
  });

  it("tracks limits per email+ip pair", () => {
    const email = `rate-pair-${Date.now()}@example.com`;

    for (let i = 0; i < 5; i += 1) {
      recordFailedLogin(email, "1.1.1.1");
    }

    expect(checkLoginRateLimit(email, "1.1.1.1").allowed).toBe(false);
    expect(checkLoginRateLimit(email, "2.2.2.2").allowed).toBe(true);
  });
});
