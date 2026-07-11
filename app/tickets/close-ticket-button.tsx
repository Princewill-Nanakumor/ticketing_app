"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal, useFormStatus } from "react-dom";
import { FiLoader } from "react-icons/fi";
import { closeTicket } from "@/app/actions/tickets";

function subscribe() {
  return () => {};
}

function CloseSubmitButton({
  onPendingChange,
}: {
  onPendingChange: (pending: boolean) => void;
}) {
  const { pending } = useFormStatus();

  useEffect(() => {
    onPendingChange(pending);
  }, [pending, onPendingChange]);

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full cursor-pointer items-center justify-center gap-2 border border-red-700/40 bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
    >
      {pending ? (
        <>
          <FiLoader aria-hidden className="spinner size-4" />
          <span>Closing…</span>
        </>
      ) : (
        "Close ticket"
      )}
    </button>
  );
}

export default function CloseTicketButton({
  ticketId,
  redirectTo = "/tickets",
  fullWidth = true,
}: {
  ticketId: string;
  redirectTo?: string;
  fullWidth?: boolean;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const onPendingChange = useCallback((nextPending: boolean) => {
    setPending(nextPending);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, pending]);

  function closeModal() {
    if (!pending) {
      setOpen(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`cursor-pointer border border-red-700/40 bg-red-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-800 ${
          fullWidth ? "w-full sm:w-auto" : "w-auto"
        }`}
      >
        Close ticket
      </button>

      {isClient && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 px-6"
              onClick={closeModal}
              role="presentation"
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="w-full max-w-md border border-ink/10 bg-paper p-6 text-ink shadow-lg"
                onClick={(event) => event.stopPropagation()}
              >
                <h2
                  id={titleId}
                  className="font-(family-name:--font-helix-display) text-2xl leading-snug"
                >
                  Close ticket?
                </h2>
                <p
                  id={descriptionId}
                  className="mt-3 text-sm leading-relaxed text-sage"
                >
                  Are you sure you want to close this ticket? New replies will
                  be disabled once it is closed.
                </p>

                <form
                  action={closeTicket}
                  className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end"
                >
                  <input type="hidden" name="ticketId" value={ticketId} />
                  <input type="hidden" name="redirectTo" value={redirectTo} />
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={pending}
                    className="inline-flex w-full cursor-pointer items-center justify-center border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-mist/40 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <CloseSubmitButton onPendingChange={onPendingChange} />
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
