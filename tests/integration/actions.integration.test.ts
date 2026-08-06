import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined,
    set: (name: string, value: string) => {
      cookieJar.set(name, value);
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  })),
  headers: vi.fn(async () => ({
    get: (name: string) =>
      name.toLowerCase() === "x-forwarded-for" ? "127.0.0.1" : null,
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/sentry", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/flash", () => ({
  setFlash: vi.fn().mockResolvedValue(undefined),
}));

const hasDatabase =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.AUTH_SECRET);

const describeIntegration = hasDatabase ? describe : describe.skip;

describeIntegration("auth + ticket server actions (real DB)", () => {
  const stamp = Date.now();
  const email = `vitest.actions.${stamp}@helix-test.invalid`;
  const password = "Password1!";
  let ticketId = "";
  let userId = "";

  beforeAll(async () => {
    cookieJar.clear();
  });

  afterAll(async () => {
    const { prisma } = await import("@/lib/prisma");

    if (ticketId) {
      await prisma.ticket.deleteMany({ where: { id: ticketId } });
    }

    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    } else {
      await prisma.user.deleteMany({ where: { email } });
    }

    await prisma.$disconnect();
  });

  it("registers, logs in, creates a ticket, comments, and closes it", async () => {
    const { register, login } = await import("@/app/actions/auth");
    const {
      createTicket,
      addComment,
      closeTicket,
      getTicketById,
    } = await import("@/app/actions/tickets");
    const { prisma } = await import("@/lib/prisma");

    const registerForm = new FormData();
    registerForm.set("name", "Actions User");
    registerForm.set("email", email);
    registerForm.set("password", password);

    const registered = await register({ success: false }, registerForm);
    expect(registered.success).toBe(true);

    const createdUser = await prisma.user.findUnique({ where: { email } });
    expect(createdUser).toBeTruthy();
    userId = createdUser!.id;

    const loginForm = new FormData();
    loginForm.set("email", email);
    loginForm.set("password", password);

    await expect(login({ success: false }, loginForm)).rejects.toThrow(
      /NEXT_REDIRECT:\/tickets/,
    );
    expect(cookieJar.has("helix_session")).toBe(true);

    const ticketForm = new FormData();
    ticketForm.set("subject", "Action integration ticket");
    ticketForm.set("description", "Created through mocked cookies and real DB.");
    ticketForm.set("priority", "Medium");

    const created = await createTicket({ success: false }, ticketForm);
    expect(created.success).toBe(true);
    expect(created.ticketId).toMatch(/^[A-Z]{2}\d{7}$/);
    ticketId = created.ticketId!;

    const commentForm = new FormData();
    commentForm.set("body", "Integration comment from owner.");
    const commented = await addComment(
      ticketId,
      { success: false },
      commentForm,
    );
    expect(commented.success).toBe(true);

    const closeForm = new FormData();
    closeForm.set("ticketId", ticketId);
    closeForm.set("redirectTo", `/tickets/${ticketId}`);

    await expect(closeTicket(closeForm)).rejects.toThrow(
      new RegExp(`NEXT_REDIRECT:/tickets/${ticketId}`),
    );

    const detail = await getTicketById(ticketId);
    expect(detail?.status).toBe("closed");
    expect(detail?.comments).toHaveLength(1);

    const blocked = await addComment(ticketId, { success: false }, commentForm);
    expect(blocked.message).toMatch(/closed/i);
  });
});
