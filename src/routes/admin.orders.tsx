import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/catalog";
import { ORDER_STATUSES, PAYMENT_STATUSES, label } from "@/lib/admin";

export const Route = createFileRoute("/admin/orders")({ component: Orders });

function Orders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const shown = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  async function update(id: string, patch: { status?: string; payment_status?: string; tracking_number?: string | null; admin_notes?: string | null }) {
    const { error } = await supabase.from("orders").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return void toast.error("Could not save: " + error.message);
    toast.success("Order updated");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-overview"] });
  }

  function exportCsv() {
    const cols = ["order_number", "created_at", "full_name", "email", "phone", "city", "state", "pincode", "payment_method", "payment_status", "status", "subtotal", "discount", "shipping", "total", "tracking_number"] as const;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...shown.map((o) => cols.map((c) => esc(o[c])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const sel = "border border-border bg-background px-2 py-1.5 text-sm";
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl">Orders</h1>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={sel} aria-label="Filter by status">
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
          <button onClick={exportCsv} className="btn-outline !py-2"><Download className="h-4 w-4" /> CSV</button>
        </div>
      </div>
      {isLoading && <p className="mt-8 text-muted-foreground">Loading…</p>}
      {!isLoading && !shown.length && <p className="mt-8 border border-border p-8 text-center text-muted-foreground">No orders yet.</p>}
      <ul className="mt-6 space-y-3">
        {shown.map((o) => (
          <li key={o.id} className="border border-border bg-card">
            <button onClick={() => setOpen(open === o.id ? null : o.id)} className="grid w-full grid-cols-2 gap-2 p-4 text-left text-sm md:grid-cols-[1.2fr_1.5fr_1fr_1fr_1fr]">
              <span className="font-medium">{o.order_number}</span>
              <span className="truncate">{o.full_name}</span>
              <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</span>
              <span>{label(o.status)} · {o.payment_method.toUpperCase()}</span>
              <span className="text-right font-medium">{inr(o.total)}</span>
            </button>
            {open === o.id && (
              <div className="grid gap-6 border-t border-border p-4 text-sm md:grid-cols-2">
                <div>
                  <p className="eyebrow mb-2">Items</p>
                  <ul className="space-y-1">
                    {o.order_items.map((i) => (
                      <li key={i.id} className="flex justify-between"><span>{i.title} · {i.size} · {i.color} × {i.quantity}</span><span>{inr(i.unit_price * i.quantity)}</span></li>
                    ))}
                  </ul>
                  <p className="mt-3 text-muted-foreground">Subtotal {inr(o.subtotal)} · Discount {inr(o.discount)}{o.coupon_code ? ` (${o.coupon_code})` : ""} · Shipping {inr(o.shipping)} ({o.delivery_method})</p>
                  <p className="eyebrow mb-2 mt-5">Ship to</p>
                  <p>{o.full_name}<br />{o.address_line1}{o.address_line2 ? `, ${o.address_line2}` : ""}<br />{o.city}, {o.state} {o.pincode}<br />{o.phone} · {o.email}</p>
                  {o.payment_reference && <p className="mt-3">UPI transaction ID: <strong>{o.payment_reference}</strong></p>}
                </div>
                <div className="space-y-3">
                  <label className="block"><span className="eyebrow">Order status</span>
                    <select defaultValue={o.status} onChange={(e) => update(o.id, { status: e.target.value })} className={`${sel} mt-1 w-full`}>
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </select></label>
                  <label className="block"><span className="eyebrow">Payment</span>
                    <select defaultValue={o.payment_status} onChange={(e) => update(o.id, { payment_status: e.target.value })} className={`${sel} mt-1 w-full`}>
                      {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                    </select></label>
                  <label className="block"><span className="eyebrow">Tracking number</span>
                    <input defaultValue={o.tracking_number ?? ""} maxLength={80} onBlur={(e) => e.target.value !== (o.tracking_number ?? "") && update(o.id, { tracking_number: e.target.value || null })} className={`${sel} mt-1 w-full`} /></label>
                  <label className="block"><span className="eyebrow">Notes</span>
                    <textarea defaultValue={o.admin_notes ?? ""} maxLength={1000} rows={3} onBlur={(e) => e.target.value !== (o.admin_notes ?? "") && update(o.id, { admin_notes: e.target.value || null })} className={`${sel} mt-1 w-full`} /></label>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
