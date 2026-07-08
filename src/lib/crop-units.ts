import type { CropType } from "@/lib/types/marketplace";

export type UnitOption = {
  value: string;
  label: string;
  hint?: string;
};

const SHARED = {
  heap: { value: "heap", label: "Heap / pile", hint: "Market-woman style pile" },
  kg: { value: "kg", label: "Kilogram (kg)" },
  piece: { value: "piece", label: "Piece" },
  bunch: { value: "bunch", label: "Bunch" },
  bag: { value: "bag", label: "Bag" },
  crate: { value: "crate", label: "Crate" },
  tuber: { value: "tuber", label: "Tuber", hint: "One yam / root" },
} as const;

/** Ghana market-style measuring units — per crop where it matters most */
export const CROP_UNIT_PRESETS: Record<CropType, UnitOption[]> = {
  tomato: [SHARED.crate, SHARED.kg, SHARED.heap],
  pepper: [SHARED.heap, SHARED.kg, SHARED.crate],
  garden_egg: [SHARED.heap, SHARED.kg, SHARED.crate],
  okra: [SHARED.heap, SHARED.kg, SHARED.bag],
  leafy_greens: [SHARED.bunch, SHARED.heap, SHARED.kg],
  onion: [SHARED.heap, SHARED.kg, SHARED.bag],
  cucumber: [SHARED.heap, SHARED.kg, SHARED.crate],
  cabbage: [SHARED.piece, SHARED.heap, SHARED.kg],
  other: [SHARED.piece, SHARED.heap, SHARED.kg, SHARED.bunch, SHARED.bag, SHARED.crate, SHARED.tuber],
};

export function unitsForCrop(crop: CropType): UnitOption[] {
  return CROP_UNIT_PRESETS[crop] ?? CROP_UNIT_PRESETS.other;
}

export function formatAvailable(quantity: number, unit: string): string {
  const n = Number(quantity);
  if (!Number.isFinite(n)) return "—";
  if (n <= 0) return "Sold out";
  return `${n} ${unit}`;
}
