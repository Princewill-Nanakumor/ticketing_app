"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/sentry";
import {
  getTicketFieldErrors,
  ticketSchema,
  type CreateTicketState,
} from "@/app/tickets/new/schema";

export async function createTicket(
  _prevState: CreateTicketState,
  formData: FormData,
): Promise<CreateTicketState> {
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

    await logEvent({
      message,
      level: "warning",
      tags: { action: "createTicket", reason: "validation" },
      extra: { fieldErrors: errors, errorCount },
    });

    return {
      success: false,
      message,
      errors,
    };
  }

  try {
    const ticket = await prisma.ticket.create({
      data: {
        subject: parsed.data.subject,
        description: parsed.data.description,
        priority: parsed.data.priority,
      },
    });

    revalidatePath("/tickets");

    const message = "Ticket submitted successfully.";

    await logEvent({
      message,
      level: "info",
      tags: { action: "createTicket", priority: parsed.data.priority },
      extra: { ticketId: ticket.id, subject: parsed.data.subject },
    });

    return {
      success: true,
      message,
      ticketId: ticket.id,
    };
  } catch (error) {
    const message = "Could not create the ticket. Please try again.";
    const formEntries = Object.fromEntries(formData.entries());

    await logEvent({
      message,
      error,
      tags: { action: "createTicket", reason: "server" },
      extra: {
        data: parsed.data,
        formData: formEntries,
      },
    });

    return {
      success: false,
      message,
    };
  }
}
