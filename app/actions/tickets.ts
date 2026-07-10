"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/sentry";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { generateTicketId, isTicketId } from "@/lib/ticket-id";
import {
  getTicketFieldErrors,
  ticketSchema,
  type CreateTicketState,
} from "@/app/tickets/new/schema";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

async function createTicketWithUniqueId(data: {
  subject: string;
  description: string;
  priority: string;
  userId: string;
}) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = generateTicketId();

    const existing = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    try {
      return await prisma.ticket.create({
        data: {
          id,
          ...data,
        },
      });
    } catch (error) {
      lastError = error;

      // Race: another request took this ID — try a new one.
      if (isUniqueConstraintError(error)) {
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Could not generate a unique ticket ID");
}

export async function createTicket(
  _prevState: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
  const user = await getCurrentUser();

  if (!user) {
    await logEvent(
      "Unauthorized ticket creation attempt",
      "ticket",
      {},
      "warning",
    );

    return {
      success: false,
      message: "You must be logged in to create a ticket.",
    };
  }

  const parsed = ticketSchema.safeParse({
    subject: formData.get("subject"),
    description: formData.get("description"),
    priority: formData.get("priority"),
  });

  if (!parsed.success) {
    const errors = getTicketFieldErrors(parsed.error);
    const errorCount = Object.values(errors).filter(Boolean).length;
    const message =
      errorCount === 1
        ? "Please fix the error above."
        : "Please fix the errors above.";

    await logEvent(
      message,
      "ticket.validation",
      { fieldErrors: errors, errorCount, userId: user.id },
      "warning",
    );

    return {
      success: false,
      message,
      errors,
    };
  }

  try {
    const ticket = await createTicketWithUniqueId({
      subject: parsed.data.subject,
      description: parsed.data.description,
      priority: parsed.data.priority,
      userId: user.id,
    });

    revalidatePath("/tickets");

    const message = "Ticket submitted successfully.";

    await logEvent(
      message,
      "ticket.success",
      { ticketId: ticket.id, subject: parsed.data.subject, userId: user.id },
      "info",
    );

    return {
      success: true,
      message,
      ticketId: ticket.id,
    };
  } catch (error) {
    const message = "Could not create the ticket. Please try again.";
    const formEntries = Object.fromEntries(formData.entries());

    await logEvent(
      message,
      "ticket.server",
      {
        data: parsed.data,
        formData: formEntries,
        userId: user.id,
      },
      "error",
      error,
    );

    return {
      success: false,
      message,
    };
  }
}

export async function getTickets() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      await logEvent(
        "Unauthorized access to ticket list",
        "ticket",
        {},
        "warning",
      );
      return [];
    }

    // Admins see every ticket; regular users only see their own.
    const admin = isAdmin(user);
    const tickets = await prisma.ticket.findMany({
      where: admin ? undefined : { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await logEvent(
      admin ? "Fetched all tickets" : "Fetched user tickets",
      "ticket",
      {
        count: tickets.length,
        userId: user.id,
        role: user.role,
      },
      "info",
    );

    return tickets;
  } catch (error) {
    await logEvent("Error fetching tickets", "ticket", {}, "error", error);
    return [];
  }
}

export async function getTicketById(id: string) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      await logEvent(
        "Unauthorized access to ticket details",
        "ticket",
        { ticketId: id },
        "warning",
      );
      return null;
    }

    if (!isTicketId(id)) {
      await logEvent(
        "Invalid ticket ID",
        "ticket",
        { ticketId: id },
        "warning",
      );
      return null;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      await logEvent(
        "Ticket not found",
        "ticket",
        { ticketId: id },
        "warning",
      );
      return null;
    }

    const canView = isAdmin(user) || ticket.userId === user?.id;

    if (!canView) {
      await logEvent(
        "Unauthorized ticket detail attempt",
        "ticket",
        { ticketId: id, userId: user?.id },
        "warning",
      );
      return null;
    }

    await logEvent(
      "Fetched ticket details",
      "ticket",
      { ticketId: ticket.id, userId: user?.id },
      "info",
    );

    return ticket;
  } catch (error) {
    await logEvent(
      "Error fetching ticket details",
      "ticket",
      { ticketId: id },
      "error",
      error,
    );
    return null;
  }
}
