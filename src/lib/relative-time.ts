/** Human-readable ages for feed captions (TikTok-style, not raw hours). */
export function formatFeedAge(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, now - then);
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;
  const week = 7 * day;

  if (diff < minute) return "just now";
  if (diff < hour) {
    const m = Math.floor(diff / minute);
    return `${m}m ago`;
  }
  if (diff < day) {
    const h = Math.floor(diff / hour);
    return `${h}h ago`;
  }
  if (diff < week) {
    const d = Math.floor(diff / day);
    return d === 1 ? "1d ago" : `${d}d ago`;
  }
  if (diff < 30 * day) {
    const w = Math.floor(diff / week);
    return w === 1 ? "1w ago" : `${w}w ago`;
  }
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
