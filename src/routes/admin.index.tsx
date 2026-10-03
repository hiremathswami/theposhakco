import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/catalog";
import { label } from "@/lib/admin";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [o, p] = await Promise.all([
        supabase.from("orders").select("id,order_number,full_name,total,status,payment_status,created_at").order("created_at", { ascending: false }).limit(500),
        supabase.from("products").select("id,title,stock,status").order("stock"),
      ]);
      if (o.error) throw o.error;
      if (p.error) throw p.error;
      return { orders: o.data, products: p.data };
    },
  });
  const orders = data?.orders ?? [];
  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => ["placed", "confirmed", "packed"].includes(o.status)).length;
  const low = (data?.products ?? []).filter((p) => p.stock <= 5 && p.status === "active");

  const stats = [
    { k: "Orders", v: String(orders.length) },
    { k: "Revenue", v: inr(revenue) },
    { k: "To fulfil", v: String(pending) },
    { k: "Low stock", v: String(low.length) },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl">Overview</h1>
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.k} className="border border-border bg-card p-5">
            <p className="eyebrow text-muted-foreground">{s.k}</p>
            <p className="mt-2 font-display text-3xl">{s.v}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm underline">All orders</Link>
          </div>
          <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
            {orders.slice(0, 8).map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                <span className="font-medium">{o.order_number}</span>
                <span className="hidden flex-1 truncate text-muted-foreground sm:block">{o.full_name}</span>
                <span>{label(o.status)}</span>
                <span className="w-24 text-right">{inr(o.total)}</span>
              </li>
            ))}
            {!orders.length && <li className="py-6 text-muted-foreground">No orders yet.</li>}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-2xl">Low stock</h2>
          <ul className="mt-4 divide-y divide-border border-y border-border text-sm">
            {low.map((p) => (
              <li key={p.id} className="flex justify-between py-3"><span>{p.title}</span><span className="text-blood">{p.stock} left</span></li>
            ))}
            {!low.length && <li className="py-6 text-muted-foreground">All products are well stocked.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
