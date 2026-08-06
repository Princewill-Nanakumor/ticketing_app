import "dotenv/config";
import bcrypt from "bcrypt";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { generateTicketId } from "@/lib/ticket-id";
import { generateUserId } from "@/lib/user-id";

const hasDatabase = Boolean(process.env.DATABASE_URL);

const describeIntegration = hasDatabase ? describe : describe.skip;

describeIntegration("database integration", () => {
  let prisma: PrismaClient;
  const createdUserIds: string[] = [];
  const createdTicketIds: string[] = [];
  const stamp = Date.now();

  beforeAll(() => {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    if (createdTicketIds.length > 0) {
      await prisma.ticket.deleteMany({
        where: { id: { in: createdTicketIds } },
      });
    }

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }

    await prisma.$disconnect();
  });

  it("creates a user, ticket, comment, closes ticket, and records activity", async () => {
    const userId = generateUserId();
    const ticketId = generateTicketId();
    const email = `vitest.${stamp}@helix-test.invalid`;

    const passwordHash = await bcrypt.hash("Password1!", 10);

    const user = await prisma.user.create({
      data: {
        id: userId,
        name: "Vitest User",
        email,
        passwordHash,
        role: "USER",
      },
    });
    createdUserIds.push(user.id);

    const ticket = await prisma.ticket.create({
      data: {
        id: ticketId,
        subject: "Integration printer failure",
        description: "Cannot print from the warehouse floor.",
        priority: "High",
        userId: user.id,
      },
    });
    createdTicketIds.push(ticket.id);

    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        action: "created",
        detail: "Created ticket with High priority",
      },
    });

    await prisma.comment.create({
      data: {
        body: "Looking into the driver install.",
        ticketId: ticket.id,
        authorId: user.id,
      },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        action: "commented",
        detail: "Added a comment",
      },
    });

    const closed = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "closed",
        closedAt: new Date(),
      },
    });

    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        action: "closed",
        detail: "Marked ticket as closed",
      },
    });

    const loaded = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        comments: true,
        activities: { orderBy: { createdAt: "asc" } },
        user: { select: { email: true } },
      },
    });

    expect(closed.status).toBe("closed");
    expect(closed.closedAt).toBeInstanceOf(Date);
    expect(loaded?.user.email).toBe(email);
    expect(loaded?.comments).toHaveLength(1);
    expect(loaded?.activities.map((a) => a.action)).toEqual([
      "created",
      "commented",
      "closed",
    ]);
  });

  it("enforces unique emails", async () => {
    const email = `vitest.unique.${stamp}@helix-test.invalid`;
    const passwordHash = await bcrypt.hash("Password1!", 10);
    const firstId = generateUserId();
    const secondId = generateUserId();

    await prisma.user.create({
      data: {
        id: firstId,
        name: "First",
        email,
        passwordHash,
        role: "USER",
      },
    });
    createdUserIds.push(firstId);

    await expect(
      prisma.user.create({
        data: {
          id: secondId,
          name: "Second",
          email,
          passwordHash,
          role: "USER",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("verifies bcrypt passwords for a stored user", async () => {
    const userId = generateUserId();
    const email = `vitest.auth.${stamp}@helix-test.invalid`;
    const passwordHash = await bcrypt.hash("Password1!", 10);

    await prisma.user.create({
      data: {
        id: userId,
        name: "Auth Check",
        email,
        passwordHash,
        role: "USER",
      },
    });
    createdUserIds.push(userId);

    const stored = await prisma.user.findUnique({ where: { email } });
    expect(stored).toBeTruthy();
    expect(await bcrypt.compare("Password1!", stored!.passwordHash)).toBe(true);
    expect(await bcrypt.compare("WrongPass1!", stored!.passwordHash)).toBe(
      false,
    );
  });
});
