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
};

export function CategoryChips({ active, onChange }: Props) {
  return (
    <div className="feed-touch-target absolute inset-x-0 top-[max(env(safe-area-inset-top),52px)] z-20 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium backdrop-blur transition ${
            active === c.id
              ? "bg-white text-black"
              : "bg-black/35 text-white/90 border border-white/20"
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
