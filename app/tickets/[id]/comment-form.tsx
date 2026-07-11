"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { addComment } from "@/app/actions/tickets";
import { initialCommentState } from "@/app/tickets/new/schema";
import Toast from "@/components/toast";

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
  const [toastOpen, setToastOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && state.success) {
      formRef.current?.reset();
      queueMicrotask(() => {
        setBody("");
        setToastOpen(true);
      });
    }

    wasPending.current = pending;
  }, [pending, state.success]);

  const closeToast = useCallback(() => {
    setToastOpen(false);
  }, []);

  return (
    <>
      <form ref={formRef} action={formAction} noValidate>
        <fieldset disabled={pending} className={fieldsetClass}>
          <label htmlFor="body" className="block text-sm font-medium text-ink">
            Add a reply
          </label>
          <textarea
            id="body"
            name="body"
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className={fieldClass}
            placeholder="Write an update for this ticket…"
          />
          {state.errors?.body ? (
            <p className="text-sm text-red-800">{state.errors.body}</p>
          ) : null}
          {state.message && !state.success ? (
            <p className="text-sm text-red-800">{state.message}</p>
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
