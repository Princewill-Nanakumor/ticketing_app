import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    ticket: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
  isAdmin: vi.fn((user: { role?: string } | null) => user?.role === "ADMIN"),
}));

vi.mock("@/lib/admin", () => ({
  isAdminEmail: vi.fn(
    (email: string) => email.toLowerCase() === "admin@example.com",
  ),
}));

vi.mock("@/lib/sentry", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
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
    (error as Error & { digest?: string }).digest =
      `NEXT_REDIRECT;replace;${url}`;
    throw error;
  }),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("new-hash"),
  },
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { setFlash } from "@/lib/flash";
import {
  deleteUser,
  getUsers,
  updateUser,
} from "./users";

const admin = {
  id: "US9000001",
  email: "admin@example.com",
  name: "Admin",
  role: "ADMIN" as const,
};

const regular = {
  id: "US9000002",
  email: "user@example.com",
  name: "User",
  role: "USER" as const,
};

describe("getUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty for non-admins", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(regular as never);
    expect(await getUsers()).toEqual([]);
  });

  it("lists users for admins", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([regular] as never);

    const users = await getUsers();
    expect(users).toHaveLength(1);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deletedAt: null },
      }),
    );
  });
});

describe("updateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admins", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(regular as never);
    const formData = new FormData();
    formData.set("name", "User");
    formData.set("email", "user@example.com");
    formData.set("role", "USER");

    const result = await updateUser(regular.id, { success: false }, formData);
    expect(result.message).toMatch(/admin/i);
  });

  it("blocks demoting the last admin", async () => {
    const otherAdmin = {
      id: "US9000005",
      email: "second-admin@example.com",
      name: "Second Admin",
      role: "ADMIN" as const,
    };
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...otherAdmin,
      deletedAt: null,
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const formData = new FormData();
    formData.set("name", "Second Admin");
    formData.set("email", "second-admin@example.com");
    formData.set("role", "USER");

    const result = await updateUser(otherAdmin.id, { success: false }, formData);
    expect(result.message).toBe("You cannot remove the last admin.");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("blocks changing the primary admin email", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...admin,
      deletedAt: null,
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("name", "Admin");
    formData.set("email", "other@example.com");
    formData.set("role", "ADMIN");

    const result = await updateUser(admin.id, { success: false }, formData);
    expect(result.message).toBe("The primary admin email cannot be changed.");
  });

  it("updates a regular user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...regular,
      deletedAt: null,
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("name", "Updated User");
    formData.set("email", "user@example.com");
    formData.set("role", "USER");
    formData.set("password", "");

    const result = await updateUser(regular.id, { success: false }, formData);
    expect(result.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalled();
  });
});

describe("deleteUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects non-admins to login", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(regular as never);
    const formData = new FormData();
    formData.set("userId", regular.id);

    await expect(deleteUser(formData)).rejects.toThrow(
      /NEXT_REDIRECT:\/login/,
    );
  });

  it("does not allow self-delete", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    const formData = new FormData();
    formData.set("userId", admin.id);

    await expect(deleteUser(formData)).rejects.toThrow(
      /NEXT_REDIRECT:\/users/,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not delete the primary admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      ...admin,
      id: "US9000099",
      email: "other-admin@example.com",
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...admin,
      deletedAt: null,
    } as never);

    const formData = new FormData();
    formData.set("userId", admin.id);

    await expect(deleteUser(formData)).rejects.toThrow(
      /NEXT_REDIRECT:\/users/,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("soft-deletes a user and reassigns tickets", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(admin as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...regular,
      deletedAt: null,
    } as never);
    vi.mocked(prisma.ticket.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("userId", regular.id);

    await expect(deleteUser(formData)).rejects.toThrow(
      /NEXT_REDIRECT:\/users/,
    );

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(setFlash).toHaveBeenCalledWith("user_deleted");
  });
});
