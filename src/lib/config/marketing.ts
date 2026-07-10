/** Static marketing copy — not app runtime data. Shown when live DB stats are empty. */

export const TESTIMONIALS = [
  {
    quote:
      "We swapped three middlemen for AgroLink. Margins up 22%, waste down to almost zero.",
    name: "Esi Owusu",
    role: "Head Chef, Skybar East Legon",
  },
  {
    quote: "I post a video in the morning and my tomatoes are sold by noon. It changed my farm.",
    name: "Kwame Asare",
    role: "Farmer · Dodowa",
  },
  {
    quote: "Two runs a day, paid same evening on MoMo. The job board is always full.",
    name: "Yaw Ofori",
    role: "Transport Partner · Tema",
  },
] as const;

export function formatGmv(ghs: number): string {
  if (ghs >= 1_000_000) return `GHS ${(ghs / 1_000_000).toFixed(1)}M`;
  if (ghs >= 1_000) return `GHS ${Math.round(ghs / 1_000)}k`;
  return `GHS ${Math.round(ghs)}`;
}
