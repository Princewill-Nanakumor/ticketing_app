import { prisma } from "@/lib/prisma";

export async function recordTicketActivity(input: {
  ticketId: string;
  actorId: string;
  action: string;
  detail?: string;
}) {
  await prisma.ticketActivity.create({
    data: {
      ticketId: input.ticketId,
      actorId: input.actorId,
      action: input.action,
      detail: input.detail,
    },
  });
}

export function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}
