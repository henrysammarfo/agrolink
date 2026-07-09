const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tomato", label: "Tomato" },
  { id: "pepper", label: "Pepper" },
  { id: "okra", label: "Okra" },
  { id: "onion", label: "Onion" },
  { id: "leafy_greens", label: "Greens" },
  { id: "garden_egg", label: "Garden egg" },
] as const;

type Props = {
  active: string;
  onChange: (id: string) => void;
  inAppFeed?: boolean;
};

export function CategoryChips({ active, onChange, inAppFeed = false }: Props) {
  return (
    <div
      className={`feed-touch-target flex gap-1.5 overflow-x-auto px-3 pb-2 no-scrollbar ${
        inAppFeed ? "justify-start" : "absolute inset-x-0 top-[max(env(safe-area-inset-top),3rem)] z-20 justify-center px-12"
      }`}
    >
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur-sm transition ${
            active === c.id
              ? "bg-white text-black"
              : "border border-white/20 bg-black/25 text-white/90"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

export function filterByCategory<T extends { crop_type?: string | null }>(
  items: T[],
  category: string,
): T[] {
  if (category === "all") return items;
  return items.filter((i) => i.crop_type === category);
}
