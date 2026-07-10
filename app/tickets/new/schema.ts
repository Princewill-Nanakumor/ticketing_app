import { z } from "zod";

export const PRIORITIES = ["Low", "Medium", "High"] as const;

export const ticketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(120, "Subject must be 120 characters or fewer"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be 5000 characters or fewer"),
  priority: z.enum(PRIORITIES, {
    error: "Select a valid priority",
  }),
});

export type TicketInput = z.infer<typeof ticketSchema>;
export type TicketFieldErrors = Partial<
  Record<keyof TicketInput, string | undefined>
>;

export type CreateTicketState = {
  success: boolean;
  message?: string;
  errors?: TicketFieldErrors;
  ticketId?: string;
};

export const initialCreateTicketState: CreateTicketState = {
  success: false,
};

export function getTicketFieldErrors(
  error: z.ZodError<TicketInput>,
): TicketFieldErrors {
  const { fieldErrors } = error.flatten();

  return {
    subject: fieldErrors.subject?.[0],
    description: fieldErrors.description?.[0],
    priority: fieldErrors.priority?.[0],
  };
}
