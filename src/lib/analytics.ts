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
    // Optional — load Sentry from CDN only when DSN is set (no npm package required)
    const s = document.createElement("script");
    s.src = "https://browser.sentry-cdn.com/8.45.0/bundle.min.js";
    s.crossOrigin = "anonymous";
    s.async = true;
    s.onload = () => {
      const Sentry = (window as Window & { Sentry?: { init: (o: object) => void } }).Sentry;
      Sentry?.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
      });
    };
    document.head.appendChild(s);
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  const ph = (window as Window & { posthog?: { capture: (n: string, p?: object) => void } }).posthog;
  ph?.capture(name, props);
}
