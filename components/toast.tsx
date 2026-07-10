"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FiCheck } from "react-icons/fi";

type ToastProps = {
  message: string;
  title?: string;
  open: boolean;
  onClose: () => void;
  durationMs?: number;
};

function subscribe() {
  return () => {};
}

export default function Toast({
  message,
  title = "Ticket created",
  open,
  onClose,
  durationMs = 4200,
}: ToastProps) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose, message]);

  if (!isClient || !open) {
    return null;
  }

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="toast-viewport toast-enter is-visible border border-brass/40 bg-ink px-4 py-3.5 text-paper sm:px-5 sm:py-4"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center border border-brass/50 text-brass">
          <FiCheck aria-hidden className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="font-(family-name:--font-helix-display) text-sm tracking-wide">
            {title}
          </p>
          <p className="mt-1 wrap-break-word text-sm text-mist">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer shrink-0 text-sm text-mist transition hover:text-paper"
        >
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
