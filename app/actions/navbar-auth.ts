"use server";

import { prisma } from "@/lib/prisma";
import {
  destroySession,
  getSessionUser,
  isAdmin,
} from "@/lib/current-user";

function getFirstName(name?: string | null) {
  if (!name) {
    return null;
  }

  const first = name.trim().split(/\s+/)[0];
  return first || null;
}

export type NavbarAuth = {
  firstName: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  ticketCount: number;
};

const emptyAuth: NavbarAuth = {
  firstName: null,
  isAuthenticated: false,
  isAdmin: false,
  ticketCount: 0,
};

/** Re-check the session against the DB and clear stale cookies (e.g. soft-deleted users). */
export async function syncNavbarAuth(): Promise<NavbarAuth> {
  const session = await getSessionUser();

  if (!session) {
    return emptyAuth;
  }

  const user = await prisma.user.findFirst({
    where: { id: session.id, deletedAt: null },
    select: { id: true, name: true, role: true },
  });

  if (!user) {
    await destroySession();
    return emptyAuth;
  }

  const admin = isAdmin(user);
  const ticketCount = await prisma.ticket.count({
    where: admin ? undefined : { userId: user.id },
  });

  return {
    firstName: getFirstName(user.name),
    isAuthenticated: true,
    isAdmin: admin,
    ticketCount,
  };
}
