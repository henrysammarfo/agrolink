import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Sprout, User, ClipboardList } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuth } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";
import { apiFetch } from "@/lib/api/fetch-auth";

type SearchResult = {
  listings: { id: string; title: string; seller_name: string; seller_slug: string; price_per_unit: number; unit: string }[];
  farmers: { id: string; display_name: string; slug: string; region: string | null }[];
  orders: { id: string; status: string; total_amount: number }[];
};

type Props = { role: string; open: boolean; onOpenChange: (open: boolean) => void };

export function GlobalSearch({ role, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query, role });
        const res = await apiFetch(`/api/search/global?${params}`);
        const data = (await res.json()) as SearchResult;
        setResults(data);
        trackEvent("search", { query, role, results: data.listings.length + data.farmers.length });
      } finally {
        setLoading(false);
      }
    },
    [role, user?.id],
  );

  useEffect(() => {
    const t = setTimeout(() => search(q), 200);
    return () => clearTimeout(t);
  }, [q, search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  const go = (to: string, params?: Record<string, string>) => {
    onOpenChange(false);
    setQ("");
    if (params) navigate({ to: to as "/farmers/$slug", params: params as { slug: string } });
    else navigate({ to: to as "/app/buyer/feed" });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder={`Search ${role === "buyer" ? "produce, farmers, orders" : role === "farmer" ? "orders, buyers" : role === "admin" ? "listings, payments" : "jobs"}…`}
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        <CommandEmpty>{loading ? "Searching…" : q.length < 2 ? "Type 2+ characters" : "No results"}</CommandEmpty>
        {results && results.listings.length > 0 && (
          <CommandGroup heading="Produce">
            {results.listings.map((l) => (
              <CommandItem key={l.id} onSelect={() => go("/app/buyer/feed")}>
                <Sprout className="mr-2 h-4 w-4 text-primary" />
                <span>{l.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">GHS {l.price_per_unit}/{l.unit}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results && results.farmers.length > 0 && (
          <CommandGroup heading="Farmers">
            {results.farmers.filter((f) => f.slug || f.id).map((f) => (
              <CommandItem key={f.id} onSelect={() => go("/farmers/$slug", { slug: f.slug ?? f.id })}>
                <User className="mr-2 h-4 w-4" />
                <span>{f.display_name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{f.region}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results && results.orders.length > 0 && (
          <CommandGroup heading="Orders">
            {results.orders.map((o) => (
              <CommandItem key={o.id} onSelect={() => go("/app/buyer/orders")}>
                <ClipboardList className="mr-2 h-4 w-4" />
                <span>{o.id.slice(0, 8)}</span>
                <span className="ml-auto text-xs text-muted-foreground">{o.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground w-80 max-w-full hover:border-primary/40 transition"
    >
      <Search className="h-4 w-4" />
      <span className="flex-1 text-left">Search produce, farmers…</span>
      <kbd className="rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
    </button>
  );
}
