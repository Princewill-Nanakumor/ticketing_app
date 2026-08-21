import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    comment: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
  isAdmin: vi.fn((user: { role?: string } | null) => user?.role === "ADMIN"),
}));

vi.mock("@/lib/sentry", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/ticket-activity", () => ({
  recordTicketActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/flash", () => ({
  setFlash: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT:${url}`);
    (error as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url}`;
    throw error;
  }),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { recordTicketActivity } from "@/lib/ticket-activity";
import { setFlash } from "@/lib/flash";
import {
  addComment,
  closeTicket,
  createTicket,
  getTicketById,
  getTickets,
} from "./tickets";

const owner = {
  id: "US1000001",
  email: "owner@example.com",
  name: "Owner",
  role: "USER" as const,
};

const stranger = {
  id: "US1000002",
  email: "other@example.com",
  name: "Other",
  role: "USER" as const,
};

const admin = {
  id: "US1000003",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN" as const,
};

describe("createTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("subject", "Need help");
    formData.set("description", "Something is broken badly");
    formData.set("priority", "High");

    const result = await createTicket({ success: false }, formData);

    expect(result).toEqual({
      success: false,
      message: "You must be logged in to create a ticket.",
    });
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("returns validation errors for bad input", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);

    const formData = new FormData();
    formData.set("subject", "");
    formData.set("description", "short");
    formData.set("priority", "Urgent");

    const result = await createTicket({ success: false }, formData);

    expect(result.success).toBe(false);
    expect(result.errors?.subject).toBeTruthy();
    expect(prisma.ticket.create).not.toHaveBeenCalled();
  });

  it("creates a ticket for a logged-in user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.ticket.create).mockResolvedValue({
      id: "TK1000001",
      subject: "Need help",
      description: "Something is broken badly",
      priority: "High",
      userId: owner.id,
    } as never);

    const formData = new FormData();
    formData.set("subject", "Need help");
    formData.set("description", "Something is broken badly");
    formData.set("priority", "High");

    const result = await createTicket({ success: false }, formData);

    expect(result.success).toBe(true);
    expect(result.ticketId).toBe("TK1000001");
    expect(recordTicketActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: "TK1000001",
        actorId: owner.id,
        action: "created",
      }),
    );
  });
});

describe("getTickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty list when logged out", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect(await getTickets()).toEqual([]);
  });

  it("scopes regular users to their own tickets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([] as never);

    await getTickets();

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: owner.id },
      }),
    );
  });

  it("lets admins see all tickets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([] as never);

    await getTickets();

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: undefined,
      }),
    );
  });

  it("lets admins filter tickets by user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([] as never);

    await getTickets({ userId: owner.id });

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: owner.id },
      }),
    );
  });

  it("ignores a user filter for regular users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);
    vi.mocked(prisma.ticket.findMany).mockResolvedValue([] as never);

    await getTickets({ userId: stranger.id });

    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: owner.id },
      }),
    );
  });
});

describe("getTicketById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for invalid ticket ids", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);
    expect(await getTicketById("bad-id")).toBeNull();
  });

  it("blocks non-owners from viewing", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(stranger as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "TK1000001",
      userId: owner.id,
      subject: "Secret",
    } as never);

    expect(await getTicketById("TK1000001")).toBeNull();
  });

  it("allows the owner to view", async () => {
    const ticket = {
      id: "TK1000001",
      userId: owner.id,
      subject: "Mine",
    };
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(ticket as never);

    expect(await getTicketById("TK1000001")).toEqual(ticket);
  });
});

describe("addComment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects comments from logged-out users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const formData = new FormData();
    formData.set("body", "Hello");

    const result = await addComment("TK1000001", { success: false }, formData);
    expect(result.message).toBe("You must be logged in.");
  });

  it("rejects comments on closed tickets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "TK1000001",
      userId: owner.id,
      status: "closed",
    } as never);

    const formData = new FormData();
    formData.set("body", "Still broken?");

    const result = await addComment("TK1000001", { success: false }, formData);
    expect(result.message).toMatch(/closed/i);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });

  it("rejects comments from non-owners", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(stranger as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "TK1000001",
      userId: owner.id,
      status: "open",
    } as never);

    const formData = new FormData();
    formData.set("body", "I should not post this");

    const result = await addComment("TK1000001", { success: false }, formData);
    expect(result.message).toBe("You cannot comment on this ticket.");
  });

  it("creates a comment for the owner", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "TK1000001",
      userId: owner.id,
      status: "open",
    } as never);
    vi.mocked(prisma.comment.create).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("body", "Thanks for looking into this.");

    const result = await addComment("TK1000001", { success: false }, formData);

    expect(result.success).toBe(true);
    expect(prisma.comment.create).toHaveBeenCalledWith({
      data: {
        body: "Thanks for looking into this.",
        ticketId: "TK1000001",
        authorId: owner.id,
      },
    });
  });
});

describe("closeTicket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects logged-out users to login", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const formData = new FormData();
    formData.set("ticketId", "TK1000001");

    await expect(closeTicket(formData)).rejects.toThrow(
      /NEXT_REDIRECT:\/login/,
    );
  });

  it("does not update when a non-owner tries to close", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(stranger as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "TK1000001",
      userId: owner.id,
      status: "open",
    } as never);

    const formData = new FormData();
    formData.set("ticketId", "TK1000001");
    formData.set("redirectTo", "/tickets");

    await expect(closeTicket(formData)).rejects.toThrow(/NEXT_REDIRECT/);
    expect(prisma.ticket.update).not.toHaveBeenCalled();
  });

  it("closes an open ticket for the owner", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(owner as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "TK1000001",
      userId: owner.id,
      status: "open",
    } as never);
    vi.mocked(prisma.ticket.update).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("ticketId", "TK1000001");
    formData.set("redirectTo", "/tickets");

    await expect(closeTicket(formData)).rejects.toThrow(
      /NEXT_REDIRECT:\/tickets/,
    );

    expect(prisma.ticket.update).toHaveBeenCalledWith({
      where: { id: "TK1000001" },
      data: expect.objectContaining({
        status: "closed",
        closedAt: expect.any(Date),
      }),
    });
    expect(recordTicketActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: "TK1000001",
        actorId: owner.id,
        action: "closed",
      }),
    );
    expect(setFlash).toHaveBeenCalledWith("ticket_closed");
  });

  it("allows an admin to close another user's ticket", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      id: "TK1000001",
      userId: owner.id,
      status: "open",
    } as never);
    vi.mocked(prisma.ticket.update).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("ticketId", "TK1000001");
    formData.set("redirectTo", "/tickets/TK1000001");

    await expect(closeTicket(formData)).rejects.toThrow(
      /NEXT_REDIRECT:\/tickets\/TK1000001/,
    );
    expect(prisma.ticket.update).toHaveBeenCalled();
  });
});
