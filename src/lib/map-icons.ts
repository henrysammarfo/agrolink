/** Map pin HTML for Mapbox Marker / Leaflet divIcon (Bolt-style logistics). */

export const DRIVER_CAR_ICON_HTML = `<div style="position:relative;width:44px;height:44px">
  <span style="position:absolute;inset:0;border-radius:9999px;background:#111827;box-shadow:0 4px 14px rgba(0,0,0,.35)"></span>
  <svg viewBox="0 0 24 24" width="26" height="26" style="position:absolute;left:9px;top:9px" fill="#fff" aria-hidden="true">
    <path d="M5 11l1.5-4h11L19 11v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H8v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5zm2.2 0h9.6l-.9-2.5H8.1L7.2 11zM7 15.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
  </svg>
</div>`;

export const DRIVER_CAR_ICON_SIZE: [number, number] = [44, 44];
export const DRIVER_CAR_ICON_ANCHOR: [number, number] = [22, 22];

const PIN_BASE =
  "display:grid;place-items:center;width:32px;height:32px;border-radius:9999px;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.28);border:2px solid rgba(255,255,255,.9)";

/** Farm / produce pickup */
export function farmPinHtml(): string {
  return `<div style="${PIN_BASE};background:#c2410c" title="Farm">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/></svg>
  </div>`;
}

/** Buyer drop-off */
export function buyerPinHtml(): string {
  return `<div style="${PIN_BASE};background:#0b3d2e" title="Drop-off">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5" fill="#fff" stroke="none"/></svg>
  </div>`;
}

/** Wholesale / hub */
export function hubPinHtml(): string {
  return `<div style="${PIN_BASE};background:#14532d" title="Hub">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><rect x="3" y="8" width="18" height="12" rx="1"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>
  </div>`;
}

/** Nearby / available job (discreet) */
export function jobPinHtml(): string {
  return `<div style="${PIN_BASE};width:28px;height:28px;background:#22c55e" title="Job">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
  </div>`;
}

export function pinHtmlForKind(kind?: "farm" | "buyer" | "hub" | "driver"): string {
  if (kind === "buyer") return buyerPinHtml();
  if (kind === "hub") return hubPinHtml();
  if (kind === "driver") return jobPinHtml();
  return farmPinHtml();
}
