"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/sentry";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { generateTicketId, isTicketId } from "@/lib/ticket-id";
import { recordTicketActivity } from "@/lib/ticket-activity";
import { setFlash } from "@/lib/flash";
import { TicketStatus } from "@/app/generated/prisma/client";
import {
  commentSchema,
  getTicketFieldErrors,
  ticketSchema,
  type CommentState,
  type CreateTicketState,
} from "@/app/tickets/new/schema";

const ticketDetailInclude = {
  user: {
    select: { id: true, name: true, email: true },
  },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: {
      author: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  },
  activities: {
    orderBy: { createdAt: "desc" as const },
    take: 50,
    include: {
      actor: {
        select: { id: true, name: true, email: true },
      },
    },
  },
};

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

    await recordTicketActivity({
      ticketId: ticket.id,
      actorId: user.id,
      action: "created",
      detail: `Created ticket with ${parsed.data.priority} priority`,
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
      include: ticketDetailInclude,
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

    const canView = isAdmin(user) || ticket.userId === user.id;

    if (!canView) {
      await logEvent(
        "Unauthorized ticket detail attempt",
        "ticket",
        { ticketId: id, userId: user.id },
        "warning",
      );
      return null;
    }

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

export async function closeTicket(formData: FormData) {
  const user = await getCurrentUser();
  const ticketId = String(formData.get("ticketId") ?? "");
  const redirectToRaw = String(formData.get("redirectTo") ?? "").trim();
  const redirectTo =
    redirectToRaw === "/tickets" || redirectToRaw.startsWith("/tickets/")
      ? redirectToRaw
      : `/tickets/${ticketId}`;

  if (!user) {
    await logEvent(
      "Unauthorized ticket close attempt",
      "ticket",
      { ticketId },
      "warning",
    );
    redirect("/login");
  }

  if (!isTicketId(ticketId)) {
    await logEvent("Invalid ticket ID on close", "ticket", { ticketId }, "warning");
    redirect("/tickets");
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, status: true, userId: true },
    });

    if (!ticket) {
      await logEvent("Ticket not found on close", "ticket", { ticketId }, "warning");
      redirect("/tickets");
    }

    const canClose = isAdmin(user) || ticket.userId === user.id;

    if (!canClose) {
      await logEvent(
        "Unauthorized ticket close attempt",
        "ticket",
        { ticketId, userId: user.id },
        "warning",
      );
      redirect("/tickets");
    }

    if (ticket.status === TicketStatus.closed) {
      redirect(redirectTo);
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.closed,
        closedAt: new Date(),
      },
    });

    await recordTicketActivity({
      ticketId,
      actorId: user.id,
      action: "closed",
      detail: "Marked ticket as closed",
    });

    revalidatePath("/tickets");
    revalidatePath(`/tickets/${ticketId}`);

    await logEvent(
      "Ticket closed",
      "ticket",
      { ticketId, userId: user.id },
      "info",
    );
  } catch (error) {
    await logEvent(
      "Error closing ticket",
      "ticket",
      { ticketId, userId: user.id },
      "error",
      error,
    );
  }

  await setFlash("ticket_closed");
  redirect(redirectTo);
}

export async function addComment(
  ticketId: string,
  _prevState: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, message: "You must be logged in." };
  }

  if (!isTicketId(ticketId)) {
    return { success: false, message: "Invalid ticket." };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, userId: true, status: true },
  });

  if (!ticket) {
    return { success: false, message: "Ticket not found." };
  }

  if (ticket.status === TicketStatus.closed) {
    return {
      success: false,
      message: "This ticket is closed. New replies are disabled.",
    };
  }

  const canComment = isAdmin(user) || ticket.userId === user.id;

  if (!canComment) {
    return { success: false, message: "You cannot comment on this ticket." };
  }

  const parsed = commentSchema.safeParse({
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the comment.",
      errors: { body: parsed.error.flatten().fieldErrors.body?.[0] },
    };
  }

  await prisma.comment.create({
    data: {
      body: parsed.data.body,
      ticketId,
      authorId: user.id,
    },
  });

  await recordTicketActivity({
    ticketId,
    actorId: user.id,
    action: "commented",
    detail: "Added a comment",
  });

  revalidatePath(`/tickets/${ticketId}`);

  return {
    success: true,
    message: "Comment added.",
  };
}
