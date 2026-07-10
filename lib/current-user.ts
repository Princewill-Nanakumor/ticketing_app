import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_ENABLED } from "@/lib/auth-config";
import { SESSION_COOKIE, SESSION_HOURS } from "@/lib/auth-session";
import type { Role } from "@/app/generated/prisma/client";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!AUTH_ENABLED) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = String(payload.sub ?? "");

    if (!id) {
      return null;
    }

    return {
      id,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role === "ADMIN" ? "ADMIN" : "USER",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  if (!AUTH_ENABLED) {
    return null;
  }

  const session = await getSessionUser();

  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
}

export function isAdmin(user: { role: Role } | null | undefined) {
  return user?.role === "ADMIN";
}
