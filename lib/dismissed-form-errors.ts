"use client";

import { useCallback, useState } from "react";

const MESSAGE_KEY = "__message";

export function useDismissedErrors() {
  const [dismissed, setDismissed] = useState(() => new Set<string>());

  const dismiss = useCallback((field: string) => {
    setDismissed((current) => {
      if (current.has(field) && current.has(MESSAGE_KEY)) {
        return current;
      }

      const next = new Set(current);
      next.add(field);
      next.add(MESSAGE_KEY);
      return next;
    });
  }, []);

  const resetDismissed = useCallback(() => {
    setDismissed((current) => (current.size === 0 ? current : new Set()));
  }, []);

  function fieldError(
    errors: Partial<Record<string, string | undefined>> | undefined,
    field: string,
  ) {
    if (dismissed.has(field)) {
      return undefined;
    }

    return errors?.[field];
  }

  function formMessage(message?: string) {
    if (dismissed.has(MESSAGE_KEY)) {
      return undefined;
    }

    return message;
  }

  return { dismiss, resetDismissed, fieldError, formMessage };
}
