import { toast } from "sonner";

type Opts = {
  /** Number of automatic retries after the first attempt fails. Default 2. */
  retries?: number;
  /** Base delay between retries in ms; grows linearly. Default 700. */
  delayMs?: number;
  /** Label used in toasts (e.g. "Refund buyer"). */
  label: string;
  /** If the caller wants to offer a manual retry after all auto-attempts fail. */
  onManualRetry?: () => void;
};

/**
 * Runs `fn` and automatically retries on failure. Shows an info toast
 * while retrying, a success toast on success, and an error toast with a
 * manual "Retry" action if every attempt fails.
 */
export async function withAutoRetry<T>(fn: () => Promise<T>, opts: Opts): Promise<T> {
  const retries = opts.retries ?? 2;
  const delay = opts.delayMs ?? 700;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const value = await fn();
      if (attempt > 0) {
        toast.success(`${opts.label} succeeded`, { description: `Recovered on attempt ${attempt + 1}.` });
      }
      return value;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        toast.message(`${opts.label} failed · retrying…`, {
          description: `Attempt ${attempt + 1} of ${retries + 1}. ${errorText(error)}`,
        });
        await sleep(delay * (attempt + 1));
      }
    }
  }

  toast.error(`${opts.label} failed after ${retries + 1} attempts`, {
    description: errorText(lastError),
    action: opts.onManualRetry ? { label: "Retry", onClick: () => void opts.onManualRetry!() } : undefined,
  });
  throw lastError instanceof Error ? lastError : new Error(errorText(lastError));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function errorText(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unexpected error.";
}
