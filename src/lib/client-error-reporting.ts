/** Report client errors to Sentry when loaded via analytics bootstrap. */
export function reportClientError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const Sentry = (window as Window & {
    Sentry?: { captureException: (e: unknown, ctx?: { extra?: Record<string, unknown> }) => void };
  }).Sentry;
  Sentry?.captureException?.(error, {
    extra: { route: window.location.pathname, ...context },
  });
}
