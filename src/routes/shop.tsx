import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { productsQuery } from "@/lib/queries";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { inr } from "@/lib/catalog";

type Search = {
  q?: string;
  category?: string;
  gender?: string;
  collection?: string;
  sort?: string;
  sizes?: string;
  colors?: string;
  max?: number;
  instock?: boolean;
  wishlist?: boolean;
};

const str = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length < 100 ? v : undefined);

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: str(s.q),
    category: str(s.category),
    gender: str(s.gender),
    collection: str(s.collection),
    sort: str(s.sort),
    sizes: str(s.sizes),
    colors: str(s.colors),
    max: Number(s.max) > 0 ? Number(s.max) : undefined,
    instock: s.instock === true || s.instock === "true" ? true : undefined,
    wishlist: s.wishlist === true || s.wishlist === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop All — ThePoshakCo" },
      { name: "description", content: "Shop oversized graphic tees, minimal essentials and new drops from ThePoshakCo." },
      { property: "og:title", content: "Shop All — ThePoshakCo" },
      { property: "og:description", content: "Oversized graphic tees, minimal essentials and new drops." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  pendingComponent: () => (
    <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-4 py-16 md:grid-cols-4 md:px-8">
      {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  ),
  errorComponent: ({ error }) => <div className="p-16 text-center" role="alert">{error.message}</div>,
  notFoundComponent: () => <div className="p-16 text-center">No products found.</div>,
  component: Shop,
});

const CATS = [
  { label: "All Products", search: {} },
  { label: "New Drop", search: { collection: "new-drop" } },
  { label: "Men", search: { gender: "men" } },
  { label: "Women", search: { gender: "women" } },
  { label: "Oversized", search: { collection: "oversized" } },
  { label: "Graphic Tees", search: { category: "graphic" } },
  { label: "Minimal Tees", search: { category: "minimal" } },
] as const;
const SIZES = ["S", "M", "L", "XL", "XXL"];
const SORTS = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["best", "Best selling"],
] as const;
const PAGE = 8;

function titleFor(s: Search) {
  if (s.wishlist) return "Your Wishlist";
  if (s.q) return `Results for “${s.q}”`;
  if (s.collection === "new-drop") return "New Drop";
  if (s.collection === "oversized") return "Oversized";
  if (s.gender === "men") return "Men";
  if (s.gender === "women") return "Women";
  if (s.category === "graphic") return "Graphic Tees";
  if (s.category === "minimal") return "Minimal Tees";
  return "All Products";
}

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(productsQuery());
  const { wishlist } = useStore();
  const [limit, setLimit] = useState(PAGE);
  const [drawer, setDrawer] = useState(false);

  const allColors = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => p.colors.forEach((c) => m.set(c.name, c.hex)));
    return [...m];
  }, [products]);

  const selSizes = search.sizes?.split(",") ?? [];
  const selColors = search.colors?.split(",") ?? [];
  const maxPrice = search.max ?? 2000;

  const filtered = useMemo(() => {
    let r = products.filter((p) => {
      if (search.wishlist && !wishlist.includes(p.id)) return false;
      if (search.q) {
        const q = search.q.toLowerCase();
        if (![p.title, p.subtitle ?? "", p.category, ...p.collections].join(" ").toLowerCase().includes(q)) return false;
      }
      if (search.category && p.category !== search.category) return false;
      if (search.gender && p.gender !== search.gender && p.gender !== "unisex") return false;
      if (search.collection && !p.collections.includes(search.collection)) return false;
      if (selSizes.length && !selSizes.some((s) => p.sizes.includes(s))) return false;
      if (selColors.length && !p.colors.some((c) => selColors.includes(c.name))) return false;
      if (p.price > maxPrice) return false;
      if (search.instock && p.stock <= 0) return false;
      return true;
    });
    const s = search.sort;
    if (s === "price-asc") r = [...r].sort((a, b) => a.price - b.price);
    else if (s === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    else if (s === "newest") r = [...r].sort((a, b) => Number(b.is_new) - Number(a.is_new) || b.created_at.localeCompare(a.created_at));
    else if (s === "best") r = [...r].sort((a, b) => b.review_count - a.review_count);
    return r;
  }, [products, search, wishlist, selSizes.join(), selColors.join(), maxPrice]);

  const set = (patch: Partial<Search>) => {
    setLimit(PAGE);
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  };
  const toggleIn = (list: string[], v: string) => {
    const n = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    return n.length ? n.join(",") : undefined;
  };

  const filters = (
    <div className="space-y-8 text-sm">
      <div>
        <h3 className="eyebrow mb-3 font-sans">Categories</h3>
        <ul className="space-y-2">
          {CATS.map((c) => (
            <li key={c.label}>
              <Link to="/shop" search={c.search} onClick={() => setDrawer(false)} className="hover:text-primary" activeOptions={{ includeSearch: true, exact: true }} activeProps={{ className: "font-semibold text-primary" }}>
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <fieldset>
        <legend className="eyebrow mb-3 font-sans">Size</legend>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button key={s} aria-pressed={selSizes.includes(s)} onClick={() => set({ sizes: toggleIn(selSizes, s) })} className={`h-9 min-w-11 border px-2 text-xs ${selSizes.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground"}`}>
              {s}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="eyebrow mb-3 font-sans">Color</legend>
        <div className="flex flex-wrap gap-2">
          {allColors.map(([name, hex]) => (
            <button key={name} aria-label={name} title={name} aria-pressed={selColors.includes(name)} onClick={() => set({ colors: toggleIn(selColors, name) })} className={`h-7 w-7 rounded-full border ${selColors.includes(name) ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border"}`} style={{ backgroundColor: hex }} />
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="price" className="eyebrow mb-3 block font-sans">Max price: {inr(maxPrice)}</label>
        <input id="price" type="range" min={499} max={2000} step={50} value={maxPrice} onChange={(e) => set({ max: Number(e.target.value) >= 2000 ? undefined : Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!search.instock} onChange={(e) => set({ instock: e.target.checked || undefined })} className="accent-[var(--color-primary)]" />
        In stock only
      </label>
      {(selSizes.length || selColors.length || search.max || search.instock) && (
        <button className="text-xs underline" onClick={() => set({ sizes: undefined, colors: undefined, max: undefined, instock: undefined })}>Clear filters</button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link> / <span className="text-foreground">{titleFor(search)}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <section>
          <h1 className="font-display text-4xl md:text-5xl">{titleFor(search)}</h1>
          <div className="mb-8 mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">Showing {Math.min(limit, filtered.length)} of {filtered.length} products</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setDrawer(true)} className="flex items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-widest lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filter
              </button>
              <label className="flex items-center gap-2 text-sm">
                <span className="hidden sm:inline">Sort by</span>
                <select value={search.sort ?? "featured"} onChange={(e) => set({ sort: e.target.value === "featured" ? undefined : e.target.value })} className="border border-border bg-background px-3 py-2 text-sm">
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl">{search.wishlist ? "Your wishlist is empty." : "Nothing matches those filters."}</p>
              <p className="mt-2 text-sm text-muted-foreground">Try removing a filter or browse everything.</p>
              <Link to="/shop" className="btn-solid mt-6">View all products</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 2xl:grid-cols-4">
                {filtered.slice(0, limit).map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
              {limit < filtered.length && (
                <div className="mt-12 text-center">
                  <button onClick={() => setLimit((l) => l + PAGE)} className="btn-outline">Load more</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <Sheet open={drawer} onOpenChange={setDrawer}>
        <SheetContent side="left" className="overflow-y-auto bg-background p-6">
          <SheetTitle className="mb-6 font-display text-2xl font-normal">Filter</SheetTitle>
          {filters}
        </SheetContent>
      </Sheet>
    </div>
  );
}
