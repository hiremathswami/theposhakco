import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { getOrderConfirmation } from "@/lib/orders.functions";
import { img, inr } from "@/lib/catalog";
import { label } from "@/lib/admin";

export const Route = createFileRoute("/order/$orderNumber")({
  validateSearch: (s: Record<string, unknown>): { e?: string | undefined } => ({
    e: typeof s["e"] === "string" ? s["e"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order confirmed — ThePoshakCo" },
      { name: "description", content: "Your ThePoshakCo order confirmation." },
      { property: "og:title", content: "Order confirmed — ThePoshakCo" },
      { property: "og:description", content: "Thank you for your order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Confirmation,
});

function Confirmation() {
  const { orderNumber } = Route.useParams();
  const { e } = Route.useSearch();
  const fetchOrder = useServerFn(getOrderConfirmation);
  const { data: o, isLoading } = useQuery({
    queryKey: ["order", orderNumber, e],
    queryFn: () => fetchOrder({ data: { orderNumber, email: e ?? "" } }),
  });

  if (isLoading) return <p className="py-32 text-center text-muted-foreground">Loading your order…</p>;
  if (!o)
    return (
      <div className="mx-auto max-w-lg px-6 py-32 text-center">
        <h1 className="font-display text-3xl">Order {orderNumber}</h1>
        <p className="mt-3 text-muted-foreground">We couldn't load this order's details here. Check your email or contact us.</p>
        <Link to="/shop" className="btn-solid mt-6">Continue shopping</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 font-display text-4xl">Thank you, {o.full_name.split(" ")[0]}.</h1>
        <p className="mt-2 text-muted-foreground">Your order <strong className="text-foreground">{o.order_number}</strong> has been placed.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {o.payment_method === "upi" ? "We'll confirm once your UPI payment is verified." : "Pay when your order arrives."} Delivering to {o.city} {o.pincode}.
        </p>
      </div>
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {o.order_items.map((i, n) => (
          <li key={n} className="flex gap-3 py-4 text-sm">
            <img src={img(i.image)} alt="" className="h-16 w-14 bg-muted object-cover" />
            <div className="flex-1"><p className="font-medium">{i.title}</p><p className="text-muted-foreground">{i.size} · {i.color} × {i.quantity}</p></div>
            <span>{inr(i.unit_price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
        {o.discount > 0 && <div className="flex justify-between text-primary"><dt>Discount</dt><dd>-{inr(o.discount)}</dd></div>}
        <div className="flex justify-between"><dt>Shipping ({o.delivery_method})</dt><dd>{o.shipping ? inr(o.shipping) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-border pt-3 font-display text-2xl"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
        <div className="flex justify-between text-muted-foreground"><dt>Payment</dt><dd>{o.payment_method.toUpperCase()} · {label(o.payment_status)}</dd></div>
      </dl>
      <div className="mt-10 text-center"><Link to="/shop" className="btn-solid">Continue shopping</Link></div>
    </div>
  );
}
