/** Optional PostHog + Sentry — loads only when env keys are set. */

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const posthogKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

  if (posthogKey) {
    const s = document.createElement("script");
    s.src = "https://app.posthog.com/static/array.js";
    s.async = true;
    s.onload = () => {
      const ph = (window as Window & { posthog?: { init: (k: string, o: object) => void } }).posthog;
      ph?.init(posthogKey, {
        api_host: import.meta.env.VITE_POSTHOG_HOST ?? "https://app.posthog.com",
        capture_pageview: true,
        persistence: "localStorage",
      });
    };
    document.head.appendChild(s);
  }

  if (sentryDsn) {
    import("@sentry/browser")
      .then((Sentry) => {
        Sentry.init({
          dsn: sentryDsn,
          environment: import.meta.env.MODE,
          tracesSampleRate: 0.1,
        });
      })
      .catch(() => {
        /* @sentry/browser optional — install when VITE_SENTRY_DSN is set */
      });
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  const ph = (window as Window & { posthog?: { capture: (n: string, p?: object) => void } }).posthog;
  ph?.capture(name, props);
}
