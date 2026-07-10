"use client";

import { useActionState, useCallback, useState } from "react";
import { FiLoader } from "react-icons/fi";
import { createTicket } from "@/app/actions/tickets";
import Toast from "@/components/toast";
import PrioritySelect from "./priority-select";
import { initialCreateTicketState, type TicketInput } from "./schema";

const fieldClass =
  "w-full border bg-paper px-4 py-3 text-ink placeholder:text-sage/70 transition focus-visible:outline-none";
const fieldOkClass =
  "border-ink/15 hover:border-ink/35 focus-visible:border-brass";
const fieldErrorClass = "border-red-700/70 focus-visible:border-red-700";

const emptyValues: TicketInput = {
  subject: "",
  description: "",
  priority: "Low",
};

export default function TicketForm() {
  const [state, formAction, pending] = useActionState(
    createTicket,
    initialCreateTicketState,
  );
  const [values, setValues] = useState<TicketInput>(emptyValues);
  const [toastClosed, setToastClosed] = useState(false);
  const [handledTicketId, setHandledTicketId] = useState<string | null>(null);
  const errors = state.errors ?? {};

  if (
    state.success &&
    state.ticketId != null &&
    state.ticketId !== handledTicketId
  ) {
    setHandledTicketId(state.ticketId);
    setToastClosed(false);
    setValues(emptyValues);
  }

  const closeToast = useCallback(() => {
    setToastClosed(true);
  }, []);

  return (
    <>
      <form className="mt-10 space-y-7" action={formAction} noValidate>
        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-medium text-ink">
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={values.subject}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                subject: event.target.value,
              }))
            }
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "subject-error" : undefined}
            placeholder="Brief summary of the issue"
            className={`${fieldClass} ${errors.subject ? fieldErrorClass : fieldOkClass}`}
          />
          {errors.subject ? (
            <p id="subject-error" className="text-sm text-red-800">
              {errors.subject}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-ink"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
            placeholder="What happened, and what should happen instead?"
            className={`${fieldClass} resize-y ${
              errors.description ? fieldErrorClass : fieldOkClass
            }`}
          />
          {errors.description ? (
            <p id="description-error" className="text-sm text-red-800">
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium text-ink">Priority</span>
          <PrioritySelect
            name="priority"
            value={values.priority}
            onChange={(priority) =>
              setValues((current) => ({ ...current, priority }))
            }
            error={errors.priority}
            describedBy={errors.priority ? "priority-error" : undefined}
          />
          {errors.priority ? (
            <p id="priority-error" className="text-sm text-red-800">
              {errors.priority}
            </p>
          ) : null}
        </div>

        {!state.success && state.message ? (
          <p className="text-sm text-red-800" role="status" aria-live="polite">
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full cursor-pointer items-center justify-center gap-2 bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:cursor-pointer disabled:opacity-70 sm:w-auto"
        >
          {pending ? (
            <>
              <FiLoader aria-hidden className="spinner size-4" />
              <span>Submitting…</span>
            </>
          ) : (
            "Submit ticket"
          )}
        </button>
      </form>

      <Toast
        open={state.success && !toastClosed}
        message={state.message ?? "Your ticket was created successfully."}
        onClose={closeToast}
      />
    </>
  );
}
