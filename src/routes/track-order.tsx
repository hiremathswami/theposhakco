import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Package, Truck, Home, ClipboardCheck, ShoppingBag, XCircle, RotateCcw } from "lucide-react";
import { trackOrder } from "@/lib/orders.functions";
import { img, inr } from "@/lib/catalog";
import { label } from "@/lib/admin";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/track-order")({
  validateSearch: (s: Record<string, unknown>): { order?: string | undefined } => ({
    order: typeof s["order"] === "string" ? s["order"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track your order — ThePoshakCo" },
      { name: "description", content: "Check the status of your ThePoshakCo order with your order number and email or phone." },
      { property: "og:title", content: "Track your order — ThePoshakCo" },
      { property: "og:description", content: "See where your ThePoshakCo order is, from placed to delivered." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackPage,
});

const STEPS = [
  { key: "placed", title: "Order placed", note: "We've received your order.", icon: ShoppingBag },
  { key: "confirmed", title: "Confirmed", note: "Your order is confirmed.", icon: ClipboardCheck },
  { key: "packed", title: "Packed", note: "Packed and ready to ship.", icon: Package },
  { key: "shipped", title: "Shipped", note: "On its way to you.", icon: Truck },
  { key: "delivered", title: "Delivered", note: "Enjoy your new fit.", icon: Home },
] as const;

type Result = Awaited<ReturnType<typeof trackOrder>>;

function TrackPage() {
  const { order } = Route.useSearch();
  const track = useServerFn(trackOrder);
  const [f, setF] = useState({ orderNumber: order ?? "", contact: "" });
  const [res, setRes] = useState<Result | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const i = "w-full border border-border bg-background px-3 py-2.5 text-sm";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setRes(await track({ data: f }));
    } catch {
      setRes(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <p className="eyebrow text-muted-foreground">Order status</p>
      <h1 className="mt-3 font-display text-4xl md:text-5xl">Track your order</h1>
      <p className="mt-3 text-muted-foreground">Enter the order number from your confirmation (e.g. TPC261004-AB12C) and the email or phone you used at checkout.</p>

      <form onSubmit={submit} className="mt-8 grid gap-3 border border-border p-5 sm:grid-cols-[1fr_1fr_auto]">
        <input required aria-label="Order number" placeholder="Order number" value={f.orderNumber} onChange={(e) => setF({ ...f, orderNumber: e.target.value })} maxLength={30} className={i} />
        <input required aria-label="Email or phone" placeholder="Email or phone" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} maxLength={255} className={i} />
        <button disabled={busy} className="btn-solid">{busy ? "Checking…" : "Track"}</button>
      </form>

      {res === null && (
        <p className="mt-6 border border-border bg-card p-4 text-sm">
          We couldn't find an order with those details. Check the order number and contact, or <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="underline">WhatsApp us</a>.
        </p>
      )}
      {res && <Timeline o={res} />}
    </div>
  );
}

function Timeline({ o }: { o: NonNullable<Result> }) {
  const stopped = o.status === "cancelled" || o.status === "returned";
  const idx = STEPS.findIndex((s) => s.key === o.status);
  const date = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-4">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <p className="font-display text-2xl">{o.order_number}</p>
        </div>
        <p className="text-sm text-muted-foreground">Placed {date(o.created_at)} · {o.city} {o.pincode}</p>
      </div>

      {stopped ? (
        <div className="mt-6 flex gap-3 border border-border bg-card p-5">
          {o.status === "cancelled" ? <XCircle className="h-6 w-6 text-blood" /> : <RotateCcw className="h-6 w-6" />}
          <div><p className="font-medium">Order {label(o.status)}</p><p className="text-sm text-muted-foreground">Updated {date(o.updated_at)}. Questions? Email {CONTACT.email}.</p></div>
        </div>
      ) : (
        <ol className="mt-8">
          {STEPS.map((s, n) => {
            const done = n <= idx;
            const current = n === idx;
            const Icon = s.icon;
            return (
              <li key={s.key} className="relative flex gap-4 pb-8 last:pb-0">
                {n < STEPS.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px ${n < idx ? "bg-primary" : "bg-border"}`} />}
                <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full border ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}>
                  {done && !current ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <div className={done ? "" : "text-muted-foreground"}>
                  <p className="font-medium">{s.title}{current && <span className="ml-2 text-xs uppercase tracking-wider text-primary">Current</span>}</p>
                  <p className="text-sm text-muted-foreground">{s.note}{current && ` Updated ${date(o.updated_at)}.`}</p>
                  {s.key === "shipped" && done && o.tracking_number && <p className="mt-1 text-sm">Tracking number: <strong>{o.tracking_number}</strong></p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <ul className="mt-10 divide-y divide-border border-y border-border">
        {o.order_items.map((it, n) => (
          <li key={n} className="flex gap-3 py-3 text-sm">
            <img src={img(it.image)} alt="" className="h-14 w-12 bg-muted object-cover" />
            <div><p className="font-medium">{it.title}</p><p className="text-muted-foreground">{it.size} · {it.color} × {it.quantity}</p></div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted-foreground">Total {inr(o.total)} · {o.payment_method.toUpperCase()} · Payment {label(o.payment_status)} · {o.delivery_method} delivery</p>
      <p className="mt-6 text-sm">Need help? <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="underline">WhatsApp us</a> or <Link to="/contact" className="underline">contact support</Link>.</p>
    </section>
  );
}
