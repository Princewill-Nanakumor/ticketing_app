import * as Sentry from "@sentry/nextjs";

type LogEventOptions = {
  message?: string;
  error?: unknown;
  level?: Sentry.SeverityLevel;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  flushMs?: number;
};

/**
 * Single entry point for Sentry events.
 * Pass `error` to capture an exception; otherwise logs `message`.
 */
export async function logEvent({
  message,
  error,
  level,
  tags,
  extra,
  flushMs = 2000,
}: LogEventOptions): Promise<string | undefined> {
  const context = {
    level,
    tags,
    extra: {
      ...extra,
      ...(message && error ? { message } : {}),
    },
  };

  let eventId: string | undefined;

  if (error !== undefined && error !== null) {
    eventId = Sentry.captureException(error, context);
  } else if (message) {
    eventId = Sentry.captureMessage(message, context);
  } else {
    eventId = Sentry.captureMessage("Unknown event", {
      ...context,
      level: level ?? "warning",
    });
  }

  await Sentry.flush(flushMs);
  return eventId;
}
