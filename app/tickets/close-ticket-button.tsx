"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { FiLoader } from "react-icons/fi";
import { closeTicket } from "@/app/actions/tickets";
import Modal from "@/components/modal";

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

  const onPendingChange = useCallback((nextPending: boolean) => {
    setPending(nextPending);
  }, []);

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

      <Modal
        open={open}
        onClose={closeModal}
        labelledBy={titleId}
        describedBy={descriptionId}
        closeDisabled={pending}
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
          Are you sure you want to close this ticket? New replies will be
          disabled once it is closed.
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
      </Modal>
    </>
  );
}
