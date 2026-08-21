"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { FiLoader } from "react-icons/fi";
import { createTicket } from "@/app/actions/tickets";
import Toast from "@/components/toast";
import { requestNavbarSync } from "@/lib/navbar-sync";
import { useDismissedErrors } from "@/lib/dismissed-form-errors";
import PrioritySelect from "./priority-select";
import {
  getTicketFieldErrors,
  initialCreateTicketState,
  ticketSchema,
  type CreateTicketState,
  type TicketInput,
} from "./schema";

const fieldClass =
  "w-full border bg-paper px-4 py-3 text-ink placeholder:text-sage/70 transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70";
const fieldOkClass =
  "border-ink/15 hover:border-ink/35 focus-visible:border-brass";
const fieldErrorClass = "border-red-700/70 focus-visible:border-red-700";
const fieldsetClass =
  "m-0 min-w-0 space-y-7 border-0 p-0 disabled:opacity-70";

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
  const [clientState, setClientState] = useState<CreateTicketState | null>(null);
  const [toastClosed, setToastClosed] = useState(false);
  const [handledTicketId, setHandledTicketId] = useState<string | null>(null);
  const { dismiss, resetDismissed, fieldError, formMessage } =
    useDismissedErrors();
  const displayState = pending ? initialCreateTicketState : (clientState ?? state);
  const subjectError = fieldError(displayState.errors, "subject");
  const descriptionError = fieldError(displayState.errors, "description");
  const priorityError = fieldError(displayState.errors, "priority");
  const message = formMessage(displayState.message);

  if (
    state.success &&
    state.ticketId != null &&
    state.ticketId !== handledTicketId
  ) {
    setHandledTicketId(state.ticketId);
    setToastClosed(false);
    setClientState(null);
    setValues(emptyValues);
    resetDismissed();
  }

  useEffect(() => {
    if (!handledTicketId) {
      return;
    }

    requestNavbarSync();
  }, [handledTicketId]);

  const closeToast = useCallback(() => {
    setToastClosed(true);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    resetDismissed();
    const formData = new FormData(event.currentTarget);
    const parsed = ticketSchema.safeParse({
      subject: formData.get("subject"),
      description: formData.get("description"),
      priority: formData.get("priority"),
    });

    if (!parsed.success) {
      event.preventDefault();
      setClientState({
        success: false,
        message: "Please fix the errors above.",
        errors: getTicketFieldErrors(parsed.error),
      });
      return;
    }

    setClientState(null);
  }

  return (
    <>
      <form
        className="mt-10"
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
      >
        <fieldset disabled={pending} className={fieldsetClass}>
          <div className="space-y-2">
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-ink"
            >
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={values.subject}
              onChange={(event) => {
                dismiss("subject");
                setValues((current) => ({
                  ...current,
                  subject: event.target.value,
                }));
              }}
              aria-invalid={Boolean(subjectError)}
              aria-describedby={subjectError ? "subject-error" : undefined}
              placeholder="Brief summary of the issue"
              className={`${fieldClass} ${subjectError ? fieldErrorClass : fieldOkClass}`}
            />
            {subjectError ? (
              <p id="subject-error" className="text-sm text-red-800">
                {subjectError}
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
              onChange={(event) => {
                dismiss("description");
                setValues((current) => ({
                  ...current,
                  description: event.target.value,
                }));
              }}
              aria-invalid={Boolean(descriptionError)}
              aria-describedby={
                descriptionError ? "description-error" : undefined
              }
              placeholder="What happened, and what should happen instead?"
              className={`${fieldClass} resize-y ${
                descriptionError ? fieldErrorClass : fieldOkClass
              }`}
            />
            {descriptionError ? (
              <p id="description-error" className="text-sm text-red-800">
                {descriptionError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-medium text-ink">Priority</span>
            <PrioritySelect
              name="priority"
              value={values.priority}
              onChange={(priority) => {
                dismiss("priority");
                setValues((current) => ({ ...current, priority }));
              }}
              disabled={pending}
              error={priorityError}
              describedBy={priorityError ? "priority-error" : undefined}
            />
            {priorityError ? (
              <p id="priority-error" className="text-sm text-red-800">
                {priorityError}
              </p>
            ) : null}
          </div>

          {!displayState.success && message ? (
            <p className="text-sm text-red-800" role="status" aria-live="polite">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center gap-2 bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
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
        </fieldset>
      </form>

      <Toast
        open={state.success && !toastClosed}
        message={state.message ?? "Your ticket was created successfully."}
        onClose={closeToast}
      />
    </>
  );
}
