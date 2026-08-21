"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type AnimationEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Phase = "closed" | "open" | "exiting";

function subscribe() {
  return () => {};
}

function shouldSkipAnimation() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  closeDisabled = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy: string;
  closeDisabled?: boolean;
  children: ReactNode;
}) {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [phase, setPhase] = useState<Phase>(open ? "open" : "closed");

  if (open && phase !== "open") {
    setPhase("open");
  } else if (!open && phase === "open") {
    setPhase(shouldSkipAnimation() ? "closed" : "exiting");
  }

  const rendered = phase !== "closed";
  const exiting = phase === "exiting";

  useEffect(() => {
    if (!rendered) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !closeDisabled) {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [rendered, closeDisabled, onClose]);

  function handleOverlayAnimationEnd(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || phase !== "exiting") {
      return;
    }

    if (event.animationName !== "modal-overlay-out") {
      return;
    }

    setPhase("closed");
  }

  if (!isClient || !rendered) {
    return null;
  }

  return createPortal(
    <div
      className={`modal-overlay fixed inset-0 z-100 flex items-center justify-center bg-ink/50 px-6 ${
        exiting ? "is-exiting" : ""
      }`}
      onClick={() => {
        if (!closeDisabled) {
          onClose();
        }
      }}
      onAnimationEnd={handleOverlayAnimationEnd}
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className="modal-panel w-full max-w-md border border-ink/10 bg-paper p-6 text-ink shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
