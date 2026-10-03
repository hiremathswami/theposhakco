import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { discountPct, img, inr, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";

export function ProductCard({ p, showAdd = false }: { p: Product; showAdd?: boolean }) {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [quick, setQuick] = useState(false);
  const liked = wishlist.includes(p.id);
  const off = discountPct(p);
  const soldOut = p.stock <= 0;

  const add = (size: string) => {
    addToCart({ productId: p.id, slug: p.slug, title: p.title, image: p.images[0], price: p.price, size, color: p.colors[0]?.name ?? "Default" });
    setQuick(false);
  };

  return (
    <article className="group flex flex-col bg-card">
      <div className="relative aspect-[5/6] overflow-hidden">
        <Link to="/product/$slug" params={{ slug: p.slug }} aria-label={p.title}>
          <img src={img(p.images[0])} alt={p.title} loading="lazy" width={800} height={960} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0" />
          <img src={img(p.images[1] ?? p.images[0])} alt="" loading="lazy" width={800} height={960} className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
          {soldOut ? (
            <span className="bg-charcoal px-2 py-1 text-[10px] uppercase tracking-widest text-ivory">Sold out</span>
          ) : p.is_new ? (
            <span className="bg-ivory px-2 py-1 text-[10px] uppercase tracking-widest">New</span>
          ) : p.is_bestseller ? (
            <span className="bg-ivory px-2 py-1 text-[10px] uppercase tracking-widest">Bestseller</span>
          ) : null}
          {off > 0 && <span className="bg-blood px-2 py-1 text-[10px] uppercase tracking-widest text-ivory">-{off}%</span>}
        </div>
        <button
          onClick={() => toggleWishlist(p.id)}
          aria-label={liked ? `Remove ${p.title} from wishlist` : `Add ${p.title} to wishlist`}
          aria-pressed={liked}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-ivory/80"
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-blood text-blood" : ""}`} />
        </button>
        {!soldOut && !showAdd && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-ivory/95 p-3 transition-transform group-hover:translate-y-0 group-focus-within:translate-y-0">
            <p className="eyebrow mb-2 !text-[10px]">Quick add</p>
            <div className="flex gap-1">
              {p.sizes.map((s) => (
                <button key={s} onClick={() => add(s)} className="flex-1 border border-border py-1.5 text-xs hover:border-foreground" aria-label={`Add size ${s}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 md:p-4">
        <Link to="/product/$slug" params={{ slug: p.slug }} className="font-display text-[15px] leading-tight hover:underline">
          {p.title}
        </Link>
        {p.subtitle && <p className="text-xs text-muted-foreground">{p.subtitle}</p>}
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="font-display text-lg">
            {inr(p.price)}
            {p.compare_at_price && p.compare_at_price > p.price && (
              <span className="ml-2 text-xs text-muted-foreground line-through">{inr(p.compare_at_price)}</span>
            )}
          </p>
          <div className="flex gap-1" aria-label="Colors">
            {p.colors.slice(0, 3).map((c) => (
              <span key={c.name} title={c.name} className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
            ))}
          </div>
        </div>
        {showAdd && (
          <div className="relative mt-3">
            {quick ? (
              <div className="flex gap-1">
                {p.sizes.map((s) => (
                  <button key={s} onClick={() => add(s)} className="flex-1 border border-foreground py-2.5 text-xs hover:bg-foreground hover:text-background">
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <button disabled={soldOut} onClick={() => setQuick(true)} className="btn-solid w-full !py-3">
                {soldOut ? "Sold out" : (<><Plus className="h-3 w-3" /> Add to cart</>)}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse bg-card">
      <div className="aspect-[5/6] bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 bg-muted" />
        <div className="h-3 w-1/3 bg-muted" />
      </div>
    </div>
  );
}
