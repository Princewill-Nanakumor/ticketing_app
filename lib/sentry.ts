import * as Sentry from "@sentry/nextjs";

type LogLevel = "fatal" | "error" | "warning" | "info" | "debug";

/**
 * Single entry point for Sentry events.
 * Pass `error` to capture an exception; otherwise logs `message`.
 * Never throws — logging must not break auth or ticket flows.
 */
export async function logEvent(
  message: string,
  category: string = "general",
  data?: Record<string, unknown>,
  level: LogLevel = "info",
  error?: unknown,
): Promise<string | undefined> {
  try {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level,
    });

    let eventId: string | undefined;

    if (error !== undefined && error !== null) {
      eventId = Sentry.captureException(error, {
        level,
        tags: { category },
        extra: {
          ...data,
          message,
        },
      });
    } else {
      eventId = Sentry.captureMessage(message, {
        level,
        tags: { category },
        extra: data,
      });
    }

    await Sentry.flush(2000);
    return eventId;
  } catch (loggingError) {
    console.error("Sentry logEvent failed:", loggingError);
    return undefined;
  }
}
