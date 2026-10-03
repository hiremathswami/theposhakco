import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { FREE_SHIPPING_MIN, SHIPPING_FEE, img, inr } from "@/lib/catalog";
import { validateCoupon } from "@/lib/products.functions";
import { FreeShippingBar } from "@/components/site/MiniCart";
import { productsQuery } from "@/lib/queries";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — ThePoshakCo" },
      { name: "description", content: "Review the pieces in your ThePoshakCo cart." },
      { property: "og:title", content: "Your Cart — ThePoshakCo" },
      { property: "og:description", content: "Review the pieces in your cart." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQty, removeLine, toggleSaved, toggleWishlist } = useStore();
  const lines = cart.filter((l) => !l.savedForLater);
  const saved = cart.filter((l) => l.savedForLater);
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const check = useServerFn(validateCoupon);
  const { data: products = [] } = useQuery(productsQuery());
  const recs = products.filter((p) => !lines.some((l) => l.productId === p.id)).slice(0, 4);

  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const total = subtotal - discount + shipping;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-14">
      <div className="mb-8 flex items-end justify-between">
        <h1 className="font-display text-4xl md:text-5xl">Your Cart ({lines.reduce((n, l) => n + l.quantity, 0)})</h1>
        <Link to="/shop" className="text-sm underline">Continue shopping</Link>
      </div>

      {lines.length === 0 ? (
        <div className="border border-border py-20 text-center">
          <p className="font-display text-2xl">Your cart is empty.</p>
          <p className="mt-2 text-sm text-muted-foreground">The next story is waiting.</p>
          <Link to="/shop" className="btn-solid mt-6">Shop the collection</Link>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <ul className="divide-y divide-border border-y border-border">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-5">
                  <Link to="/product/$slug" params={{ slug: l.slug }}><img src={img(l.image)} alt={l.title} className="h-32 w-24 object-cover md:h-36 md:w-28" /></Link>
                  <div className="flex flex-1 flex-col gap-1 md:flex-row md:items-center md:gap-6">
                    <div className="flex-1">
                      <Link to="/product/$slug" params={{ slug: l.slug }} className="font-display text-lg">{l.title}</Link>
                      <p className="text-xs text-muted-foreground">{l.color} / {l.size} · {inr(l.price)}</p>
                      <div className="mt-2 flex gap-4 text-xs">
                        <button className="underline" onClick={() => toggleSaved(l.key)}>Save for later</button>
                        <button className="underline" onClick={() => { toggleWishlist(l.productId); removeLine(l.key); toast.success("Moved to wishlist"); }}>Move to wishlist</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-border">
                        <button className="p-2" onClick={() => updateQty(l.key, l.quantity - 1)} aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button>
                        <span className="w-8 text-center text-sm">{l.quantity}</span>
                        <button className="p-2" onClick={() => updateQty(l.key, l.quantity + 1)} aria-label="Increase quantity"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="w-20 text-right font-display">{inr(l.price * l.quantity)}</span>
                      <button onClick={() => removeLine(l.key)} aria-label={`Remove ${l.title}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {saved.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 font-display text-2xl">Saved for later</h2>
                <ul className="divide-y divide-border border-y border-border">
                  {saved.map((l) => (
                    <li key={l.key} className="flex items-center gap-4 py-4">
                      <img src={img(l.image)} alt={l.title} className="h-20 w-16 object-cover" />
                      <div className="flex-1"><p className="font-display">{l.title}</p><p className="text-xs text-muted-foreground">{l.color} / {l.size}</p></div>
                      <button className="text-xs underline" onClick={() => toggleSaved(l.key)}>Move to cart</button>
                      <button onClick={() => removeLine(l.key)} aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <aside className="h-fit border border-border bg-card p-6">
            <h2 className="font-display text-2xl">Order Summary</h2>
            <div className="mt-5"><FreeShippingBar subtotal={subtotal} /></div>
            <form
              className="mt-6 flex"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!code.trim()) return;
                const r = await check({ data: { code, subtotal } });
                if (r.ok) { setCoupon({ code: r.code, discount: r.discount }); toast.success(`${r.code} applied`); }
                else { setCoupon(null); toast.error(r.message); }
              }}
            >
              <label htmlFor="coupon" className="sr-only">Coupon code</label>
              <input id="coupon" value={code} maxLength={40} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code (try POSHAK10)" className="min-w-0 flex-1 border border-border bg-background px-3 py-2.5 text-sm uppercase" />
              <button className="border border-l-0 border-foreground px-4 text-xs uppercase tracking-widest">Apply</button>
            </form>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
              {coupon && <div className="flex justify-between text-primary"><dt>Discount ({coupon.code})</dt><dd>-{inr(discount)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : inr(shipping)}</dd></div>
              <div className="flex justify-between border-t border-border pt-4 font-display text-2xl"><dt>Total</dt><dd>{inr(total)}</dd></div>
            </dl>
            <button onClick={() => toast("Checkout is coming in the next update.")} className="btn-solid mt-6 w-full"><Lock className="h-3.5 w-3.5" /> Proceed to checkout</button>
            <p className="mt-4 text-xs text-muted-foreground">We accept UPI · Visa · Mastercard · RuPay · Paytm · Cash on Delivery</p>
          </aside>
        </div>
      )}

      {recs.length > 0 && (
        <section className="mt-20">
          <h2 className="display-lg mb-8 !text-3xl">Complete the look</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">{recs.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}
    </div>
  );
}
