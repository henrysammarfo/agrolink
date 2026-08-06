/** Static marketing copy — not app runtime data. No fictional testimonials. */

/** Hard problems we target (judge feedback: beyond “connect farmers and buyers”). */
export const CORRIDOR_CONSTRAINTS = [
  {
    title: "Same-day transport",
    body: "Tomato and leafy greens spoil if they sit. We match a verified driver for Dodowa → Accra kitchen pickup the day you order.",
    who: "Bottleneck: fulfillment",
  },
  {
    title: "MoMo before dispatch",
    body: "Kitchens pay with Paystack MoMo first; drivers only see paid jobs. Farmers get auto-transfer after proof of delivery.",
    who: "Bottleneck: payment + trust",
  },
  {
    title: "Accountability on the trip",
    body: "Live track, in-trip chat/call, POD photo, and admin disputes when produce is rejected, spoiled, or not delivered.",
    who: "Bottleneck: quality assurance",
  },
] as const;

/** One-sentence scope judges asked for. */
export const PITCH_SCOPE =
  "We help peri-urban Dodowa-corridor farmers move tomato and leafy greens to Accra restaurants and chop bars by solving same-day pickup, MoMo settlement, and proof of delivery.";

export function formatGmv(ghs: number): string {
  if (ghs >= 1_000_000) return `GHS ${(ghs / 1_000_000).toFixed(1)}M`;
  if (ghs >= 1_000) return `GHS ${Math.round(ghs / 1_000)}k`;
  return `GHS ${Math.round(ghs)}`;
}
