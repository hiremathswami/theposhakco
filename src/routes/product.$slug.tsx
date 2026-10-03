import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Heart, Minus, Plus, Package, ShieldCheck, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { productQuery, productsQuery } from "@/lib/queries";
import { discountPct, img, inr } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { ProductCard } from "@/components/site/ProductCard";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const [p] = await Promise.all([
      context.queryClient.ensureQueryData(productQuery(params.slug)),
      context.queryClient.ensureQueryData(productsQuery()),
    ]);
    if (!p) throw notFound();
    return { title: p.title, description: p.description };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.title} — ThePoshakCo` },
            { name: "description", content: loaderData.description.slice(0, 155) },
            { property: "og:title", content: `${loaderData.title} — ThePoshakCo` },
            { property: "og:description", content: loaderData.description.slice(0, 155) },
            { property: "og:type", content: "product" },
          ],
        }
      : { meta: [{ title: "Product not found — ThePoshakCo" }, { name: "robots", content: "noindex" }] },
  errorComponent: ({ error }) => <div className="p-16 text-center" role="alert">{(error as Error).message}</div>,
  notFoundComponent: ProductNotFound,
  component: ProductPage,
});

function ProductNotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="font-display text-3xl">This piece isn't available.</h1>
      <Link to="/shop" className="btn-solid mt-6">Back to shop</Link>
    </div>
  );
}

const SIZE_CHART = [
  ["S", 40, 27.5, 21],
  ["M", 42, 28.5, 21.5],
  ["L", 44, 29.5, 22],
  ["XL", 46, 30.5, 22.5],
  ["XXL", 48, 31.5, 23],
];

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { data: all } = useSuspenseQuery(productsQuery());
  const { addToCart, wishlist, toggleWishlist, recentlyViewed, pushRecent } = useStore();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [color, setColor] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [sizeErr, setSizeErr] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(0); setColor(0); setSize(null); setQty(1);
    pushRecent(slug);
  }, [slug]);

  if (!p) return <ProductNotFound />;
  const images = p.images.length ? p.images : ["p-signature"];
  const off = discountPct(p);
  const liked = wishlist.includes(p.id);
  const soldOut = p.stock <= 0;
  const related = all.filter((x) => x.id !== p.id && (x.category === p.category || x.collections.some((c) => p.collections.includes(c)))).slice(0, 4);
  const recents = recentlyViewed.filter((s) => s !== slug).map((s) => all.find((x) => x.slug === s)).filter(Boolean).slice(0, 4);

  const add = (buyNow = false) => {
    if (!size) { setSizeErr(true); toast.error("Please choose a size."); return; }
    addToCart({ productId: p.id, slug: p.slug, title: p.title, image: images[0] ?? "", price: p.price, size, color: p.colors[color]?.name ?? "Default" }, qty);
    if (buyNow) navigate({ to: "/cart" });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-28 pt-8 md:px-8 md:pb-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:underline">Home</Link> / <Link to="/shop" className="hover:underline">Shop</Link> / <span className="text-foreground">{p.title}</span>
      </nav>
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* Gallery */}
        <div className="flex gap-4">
          <div className="hidden w-20 shrink-0 flex-col gap-3 md:flex">
            {images.map((k, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`View image ${i + 1}`} className={`border ${i === active ? "border-foreground" : "border-transparent"}`}>
                <img src={img(k)} alt="" className="aspect-[5/6] w-full object-cover" />
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <div
              className="relative hidden aspect-[5/6] cursor-zoom-in overflow-hidden bg-card md:block"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }}
              onMouseLeave={() => setZoom(null)}
            >
              <img src={img(images[active])} alt={p.title} className="h-full w-full object-cover transition-transform duration-200" style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
            </div>
            <div
              ref={scroller}
              className="flex snap-x snap-mandatory overflow-x-auto md:hidden"
              onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            >
              {images.map((k, i) => (
                <img key={i} src={img(k)} alt={i === 0 ? p.title : ""} className="aspect-[5/6] w-full shrink-0 snap-center object-cover" />
              ))}
            </div>
            <div className="mt-3 flex justify-center gap-1.5 md:hidden">
              {images.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === active ? "bg-foreground" : "bg-border"}`} />)}
            </div>
            <button onClick={() => toggleWishlist(p.id)} aria-label={liked ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={liked} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-ivory/90">
              <Heart className={`h-5 w-5 ${liked ? "fill-blood text-blood" : ""}`} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div>
          {p.is_new && <span className="bg-muted px-2 py-1 text-[10px] uppercase tracking-widest">New drop</span>}
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{p.title}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl">{inr(p.price)}</span>
            {off > 0 && <><span className="text-muted-foreground line-through">{inr(p.compare_at_price!)}</span><span className="text-sm text-blood">({off}% off)</span></>}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="flex text-gold">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(p.rating) ? "fill-current" : ""}`} />)}</span>
            {p.rating} · {p.review_count} reviews
          </div>
          <p className="mt-6 max-w-prose text-muted-foreground">{p.description}</p>

          <fieldset className="mt-8">
            <legend className="text-sm">Color: <strong>{p.colors[color]?.name}</strong></legend>
            <div className="mt-3 flex gap-3">
              {p.colors.map((c, i) => (
                <button key={c.name} onClick={() => setColor(i)} aria-label={c.name} aria-pressed={i === color} className={`h-9 w-9 rounded-full border border-border ${i === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`} style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <div className="flex items-center justify-between">
              <legend className="text-sm">Size{size && <>: <strong>{size}</strong></>}</legend>
              <Dialog>
                <DialogTrigger className="text-xs underline">Size guide</DialogTrigger>
                <DialogContent className="bg-background">
                  <DialogTitle className="font-display text-2xl font-normal">Size guide (inches)</DialogTitle>
                  <p className="text-sm text-muted-foreground">Oversized fit. Size down for a regular look.</p>
                  <table className="mt-2 w-full text-sm">
                    <thead><tr className="border-b border-border text-left"><th className="py-2">Size</th><th>Chest</th><th>Length</th><th>Shoulder</th></tr></thead>
                    <tbody>{SIZE_CHART.map((r) => <tr key={r[0]} className="border-b border-border">{r.map((c, i) => <td key={i} className="py-2">{c}</td>)}</tr>)}</tbody>
                  </table>
                </DialogContent>
              </Dialog>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.sizes.map((s) => (
                <button key={s} onClick={() => { setSize(s); setSizeErr(false); }} aria-pressed={s === size} className={`h-11 min-w-14 border px-3 text-sm ${s === size ? "border-primary bg-primary text-primary-foreground" : sizeErr ? "border-destructive" : "border-border hover:border-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <p className={`mt-6 text-sm ${soldOut ? "text-destructive" : p.stock < 10 ? "text-blood" : "text-primary"}`}>
            {soldOut ? "Out of stock" : p.stock < 10 ? `Only ${p.stock} left — order soon` : "In stock, ready to ship"}
          </p>

          {soldOut ? (
            <NotifyMe />
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <div className="flex items-center border border-border">
                  <button className="p-3" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center" aria-live="polite">{qty}</span>
                  <button className="p-3" onClick={() => setQty((q) => Math.min(10, q + 1))} aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
                </div>
                <button onClick={() => add()} className="btn-solid flex-1">Add to cart</button>
              </div>
              <button onClick={() => add(true)} className="btn-outline w-full">Buy now</button>
            </div>
          )}

          <div className="mt-8 grid grid-cols-3 gap-3 border-y border-border py-5 text-xs">
            <div className="flex gap-2"><Truck className="h-5 w-5 shrink-0" strokeWidth={1.25} /><span>Free shipping<br /><span className="text-muted-foreground">over ₹999</span></span></div>
            <div className="flex gap-2"><Package className="h-5 w-5 shrink-0" strokeWidth={1.25} /><span>Easy returns<br /><span className="text-muted-foreground">within 7 days</span></span></div>
            <div className="flex gap-2"><ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={1.25} /><span>Secure payment<br /><span className="text-muted-foreground">100% safe</span></span></div>
          </div>

          <Tabs defaultValue="desc" className="mt-6">
            <TabsList className="h-auto w-full justify-start gap-4 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
              {[["desc", "Description"], ["fabric", "Fabric"], ["ship", "Shipping"], ["returns", "Returns"], ["care", "Care"]].map(([v, l]) => (
                <TabsTrigger key={v} value={v} className="rounded-none border-b-2 border-transparent px-0 pb-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">{l}</TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="desc" className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-1 pl-5"><li>{p.subtitle}</li><li>Oversized, dropped-shoulder fit</li><li>Unisex design</li><li>Made in India</li></ul>
            </TabsContent>
            <TabsContent value="fabric" className="text-sm text-muted-foreground">{p.fabric}</TabsContent>
            <TabsContent value="ship" className="text-sm text-muted-foreground">Ships in 1–2 business days. Delivered across India in 3–7 days. Free shipping on orders over ₹999, otherwise ₹79.</TabsContent>
            <TabsContent value="returns" className="text-sm text-muted-foreground">Easy returns or exchanges within 7 days of delivery. Items must be unworn with tags attached.</TabsContent>
            <TabsContent value="care" className="text-sm text-muted-foreground">{p.care}</TabsContent>
          </Tabs>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="display-lg mb-8 !text-3xl md:!text-4xl">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
      {recents.length > 0 && (
        <section className="mt-20">
          <h2 className="display-lg mb-8 !text-3xl md:!text-4xl">Recently viewed</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">{recents.map((x) => <ProductCard key={x!.id} p={x!} />)}</div>
        </section>
      )}

      {/* Sticky mobile bar */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-background p-3 md:hidden">
          <div className="flex-1">
            <p className="truncate font-display">{p.title}</p>
            <p className="text-sm">{inr(p.price)}{size && ` · ${size}`}</p>
          </div>
          <button onClick={() => add()} className="btn-solid !px-5">Add to cart</button>
        </div>
      )}
    </div>
  );
}

function NotifyMe() {
  const [email, setEmail] = useState("");
  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) { toast.error("Enter a valid email."); return; }
        toast.success("We'll email you when it's back.");
        setEmail("");
      }}
    >
      <label htmlFor="notify" className="text-sm">Get notified when it's back</label>
      <div className="flex gap-2">
        <input id="notify" type="email" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 border border-border bg-transparent px-3 py-3 text-sm" />
        <button className="btn-solid">Notify me</button>
      </div>
    </form>
  );
}
