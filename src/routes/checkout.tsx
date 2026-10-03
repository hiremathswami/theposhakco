import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { FREE_SHIPPING_MIN, SHIPPING_FEE, img, inr } from "@/lib/catalog";
import { placeOrder } from "@/lib/orders.functions";
import { validateCoupon } from "@/lib/products.functions";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — ThePoshakCo" },
      { name: "description", content: "Complete your ThePoshakCo order securely." },
      { property: "og:title", content: "Checkout — ThePoshakCo" },
      { property: "og:description", content: "Complete your order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const EXPRESS_FEE = 149;

function Checkout() {
  const { cart, user, clearCart } = useStore();
  const navigate = useNavigate();
  const place = useServerFn(placeOrder);
  const check = useServerFn(validateCoupon);
  const lines = cart.filter((l) => !l.savedForLater);
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  const [f, setF] = useState({ email: "", fullName: "", phone: "", address1: "", address2: "", city: "", state: "Maharashtra", pincode: "" });
  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [payment, setPayment] = useState<"cod" | "upi">("cod");
  const [upiRef, setUpiRef] = useState("");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) setF((x) => (x.email ? x : { ...x, email: user.email! }));
  }, [user]);

  const discount = coupon ? Math.min(coupon.discount, subtotal) : 0;
  const shipping = delivery === "express" ? EXPRESS_FEE : subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING_FEE;
  const total = subtotal - discount + shipping;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  if (!lines.length)
    return (
      <div className="mx-auto max-w-lg px-6 py-32 text-center">
        <h1 className="font-display text-3xl">Your cart is empty.</h1>
        <Link to="/shop" className="btn-solid mt-6">Shop the collection</Link>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agree) return setError("Please accept the terms to continue.");
    setBusy(true);
    try {
      const r = await place({
        data: {
          ...f, delivery, payment, upiRef, coupon: coupon?.code ?? "",
          items: lines.map((l) => ({ productId: l.productId, size: l.size, color: l.color, quantity: l.quantity })),
        },
      });
      if (!r.ok) return setError(r.message);
      clearCart();
      navigate({ to: "/order/$orderNumber", params: { orderNumber: r.orderNumber }, search: { e: f.email.trim().toLowerCase() } });
    } catch {
      setError("Please check your details — every field marked is required, phone needs 10 digits and PIN code 6 digits.");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";
  const radio = (on: boolean) => `flex cursor-pointer items-start gap-3 border p-4 ${on ? "border-primary bg-primary/5" : "border-border"}`;

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-8 md:py-14">
      <h1 className="font-display text-4xl md:text-5xl">Checkout</h1>
      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-10">
          <fieldset>
            <legend className="eyebrow mb-4">1 · Contact</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required type="email" placeholder="Email" value={f.email} onChange={set("email")} className={input} aria-label="Email" />
              <input required placeholder="Phone (10 digits)" value={f.phone} onChange={set("phone")} inputMode="tel" className={input} aria-label="Phone" />
            </div>
            {!user && <p className="mt-2 text-xs text-muted-foreground">Have an account? <Link to="/auth" search={{ redirect: "/checkout" }} className="underline">Sign in</Link> to track orders.</p>}
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4">2 · Shipping address</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required placeholder="Full name" value={f.fullName} onChange={set("fullName")} className={`${input} sm:col-span-2`} aria-label="Full name" />
              <input required placeholder="House / flat, street" value={f.address1} onChange={set("address1")} className={`${input} sm:col-span-2`} aria-label="Address line 1" />
              <input placeholder="Landmark, area (optional)" value={f.address2} onChange={set("address2")} className={`${input} sm:col-span-2`} aria-label="Address line 2" />
              <input required placeholder="City" value={f.city} onChange={set("city")} className={input} aria-label="City" />
              <input required placeholder="State" value={f.state} onChange={set("state")} className={input} aria-label="State" />
              <input required placeholder="PIN code" value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" className={input} aria-label="PIN code" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4">3 · Delivery</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={radio(delivery === "standard")}>
                <input type="radio" name="delivery" checked={delivery === "standard"} onChange={() => setDelivery("standard")} />
                <span><strong>Standard</strong> · 4–7 days<br /><span className="text-sm text-muted-foreground">{subtotal >= FREE_SHIPPING_MIN ? "Free" : inr(SHIPPING_FEE)}</span></span>
              </label>
              <label className={radio(delivery === "express")}>
                <input type="radio" name="delivery" checked={delivery === "express"} onChange={() => setDelivery("express")} />
                <span><strong>Express</strong> · 2–3 days<br /><span className="text-sm text-muted-foreground">{inr(EXPRESS_FEE)}</span></span>
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="eyebrow mb-4">4 · Payment</legend>
            <div className="space-y-3">
              <label className={radio(payment === "cod")}>
                <input type="radio" name="payment" checked={payment === "cod"} onChange={() => setPayment("cod")} />
                <span><strong>Cash on Delivery</strong><br /><span className="text-sm text-muted-foreground">Pay in cash or UPI when your order arrives.</span></span>
              </label>
              <label className={radio(payment === "upi")}>
                <input type="radio" name="payment" checked={payment === "upi"} onChange={() => setPayment("upi")} />
                <span className="flex-1"><strong>Pay now with UPI</strong><br />
                  <span className="text-sm text-muted-foreground">Pay {inr(total)} on GPay / PhonePe / Paytm to {CONTACT.phoneDisplay} (ThePoshakCo), then enter the transaction ID. We confirm your order once the payment is verified.</span>
                  {payment === "upi" && (
                    <input value={upiRef} onChange={(e) => setUpiRef(e.target.value.trim())} maxLength={40} placeholder="UPI transaction ID (12 digits)" className={`${input} mt-3`} aria-label="UPI transaction ID" />
                  )}
                </span>
              </label>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> We never ask for or store card details.</p>
          </fieldset>
        </div>

        <aside className="h-fit border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-2xl">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-3 text-sm">
                <img src={img(l.image)} alt="" className="h-16 w-14 bg-muted object-cover" />
                <div className="flex-1"><p className="font-medium">{l.title}</p><p className="text-muted-foreground">{l.size} · {l.color} × {l.quantity}</p></div>
                <span>{inr(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" maxLength={40} className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-sm uppercase" aria-label="Coupon code" />
            <button type="button" onClick={async () => {
              if (!code.trim()) return;
              const r = await check({ data: { code, subtotal } });
              if (r.ok) { setCoupon({ code: r.code, discount: r.discount }); setError(null); } else { setCoupon(null); setError(r.message); }
            }} className="border border-l-0 border-foreground px-4 text-xs uppercase tracking-widest">Apply</button>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
            {coupon && <div className="flex justify-between text-primary"><dt>Discount ({coupon.code})</dt><dd>-{inr(discount)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping ? inr(shipping) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-border pt-3 font-display text-2xl"><dt>Total</dt><dd>{inr(total)}</dd></div>
          </dl>
          <label className="mt-5 flex items-start gap-2 text-xs">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
            <span>I agree to the terms, and the 7-day return policy.</span>
          </label>
          {error && <p role="alert" className="mt-4 border border-blood/40 p-3 text-sm text-blood">{error}</p>}
          <button disabled={busy} className="btn-solid mt-5 w-full disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-3.5 w-3.5" />} Place order · {inr(total)}
          </button>
        </aside>
      </form>
    </div>
  );
}
