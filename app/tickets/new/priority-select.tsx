"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { PRIORITIES, type TicketInput } from "./schema";

type Priority = TicketInput["priority"];

export default function PrioritySelect({
  name = "priority",
  value,
  onChange,
  error,
  describedBy,
}: {
  name?: string;
  value: Priority;
  onChange: (value: Priority) => void;
  error?: string;
  describedBy?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-describedby={describedBy}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between border bg-paper px-4 py-3 text-left text-ink transition focus-visible:outline-none ${
          error
            ? "border-red-700/70 focus-visible:border-red-700"
            : "border-ink/15 hover:border-ink/35 focus-visible:border-brass"
        }`}
      >
        <span>{value}</span>
        <FiChevronDown
          aria-hidden
          className={`size-4 text-sage transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Priority"
          className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-20 border border-ink/15 bg-paper py-1"
        >
          {PRIORITIES.map((option) => {
            const selected = option === value;
            return (
              <li key={option} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-mist ${
                    selected ? "bg-mist/70 text-ink" : "text-ink-soft"
                  }`}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
