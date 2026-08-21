"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { addComment } from "@/app/actions/tickets";
import { commentSchema, initialCommentState } from "@/app/tickets/new/schema";
import Toast from "@/components/toast";
import { useDismissedErrors } from "@/lib/dismissed-form-errors";

const fieldClass =
  "w-full border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-sage/70 transition hover:border-ink/35 focus-visible:border-brass focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70";

const fieldsetClass =
  "m-0 min-w-0 space-y-3 border-0 p-0 disabled:opacity-70";

export default function CommentForm({ ticketId }: { ticketId: string }) {
  const action = addComment.bind(null, ticketId);
  const [state, formAction, pending] = useActionState(
    action,
    initialCommentState,
  );
  const [body, setBody] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);
  const { dismiss, resetDismissed, fieldError, formMessage } =
    useDismissedErrors();

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      formRef.current?.reset();
      queueMicrotask(() => {
        setBody("");
        setClientError(null);
        resetDismissed();
        setToastOpen(true);
      });
    }

    wasPending.current = pending;
  }, [pending, state.success, resetDismissed]);

  const closeToast = useCallback(() => {
    setToastOpen(false);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    resetDismissed();
    const parsed = commentSchema.safeParse({
      body: new FormData(event.currentTarget).get("body"),
    });

    if (!parsed.success) {
      event.preventDefault();
      setClientError(
        parsed.error.flatten().fieldErrors.body?.[0] ?? "Comment is required",
      );
      return;
    }

    setClientError(null);
  }

  const bodyError = pending
    ? null
    : fieldError(
        { body: clientError ?? state.errors?.body },
        "body",
      );
  const message = formMessage(
    state.message && !state.success && !clientError ? state.message : undefined,
  );

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
      >
        <fieldset disabled={pending} className={fieldsetClass}>
          <label htmlFor="body" className="block text-sm font-medium text-ink">
            Add a reply
          </label>
          <textarea
            id="body"
            name="body"
            rows={4}
            value={body}
            onChange={(event) => {
              dismiss("body");
              setBody(event.target.value);
            }}
            className={fieldClass}
            placeholder="Write an update for this ticket…"
            aria-invalid={Boolean(bodyError)}
            aria-describedby={bodyError ? "comment-error" : undefined}
          />
          {bodyError ? (
            <p id="comment-error" className="text-sm text-red-800">
              {bodyError}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-red-800">{message}</p>
          ) : null}
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center justify-center bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? "Posting…" : "Post reply"}
          </button>
        </fieldset>
      </form>

      <Toast
        open={toastOpen}
        title="Reply posted"
        message={state.message ?? "Your reply was added successfully."}
        onClose={closeToast}
      />
    </>
  );
}
