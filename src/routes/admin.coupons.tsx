import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/catalog";

export const Route = createFileRoute("/admin/coupons")({ component: Coupons });

function Coupons() {
  const qc = useQueryClient();
  const { data: coupons = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ code: "", kind: "percent", value: "", min: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-coupons"] });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const value = parseInt(form.value, 10);
    if (!/^[A-Z0-9]{3,20}$/.test(code)) return void toast.error("Code: 3–20 letters or numbers.");
    if (!value || value < 1 || (form.kind === "percent" && value > 90)) return void toast.error("Enter a valid discount (percent max 90).");
    const { error } = await supabase.from("coupons").insert({ code, kind: form.kind, value, min_order: parseInt(form.min, 10) || 0, active: true });
    if (error) return void toast.error(error.message.includes("duplicate") ? "That code already exists." : error.message);
    toast.success(`${code} created`);
    setForm({ code: "", kind: "percent", value: "", min: "" });
    refresh();
  }
  async function toggle(code: string, active: boolean) {
    const { error } = await supabase.from("coupons").update({ active }).eq("code", code);
    if (error) return void toast.error(error.message);
    refresh();
  }
  async function remove(code: string) {
    if (!confirm(`Delete ${code}?`)) return;
    const { error } = await supabase.from("coupons").delete().eq("code", code);
    if (error) return void toast.error(error.message);
    refresh();
  }

  const f = "border border-border bg-background px-3 py-2 text-sm";
  return (
    <div>
      <h1 className="font-display text-4xl">Coupons</h1>
      <form onSubmit={add} className="mt-8 grid gap-3 border border-border bg-card p-5 sm:grid-cols-5">
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CODE" className={`${f} uppercase`} aria-label="Code" />
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} className={f} aria-label="Type">
          <option value="percent">% off</option>
          <option value="fixed">₹ off</option>
        </select>
        <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value.replace(/\D/g, "") })} placeholder="Amount" className={f} aria-label="Amount" />
        <input value={form.min} onChange={(e) => setForm({ ...form, min: e.target.value.replace(/\D/g, "") })} placeholder="Min order ₹ (optional)" className={f} aria-label="Minimum order" />
        <button className="btn-solid !py-2">Add coupon</button>
      </form>
      <table className="mt-8 w-full text-sm">
        <thead><tr className="border-b border-border text-left"><th className="py-2">Code</th><th>Discount</th><th>Min order</th><th>Active</th><th /></tr></thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.code} className="border-b border-border">
              <td className="py-3 font-medium">{c.code}</td>
              <td>{c.kind === "percent" ? `${c.value}%` : inr(c.value)}</td>
              <td>{c.min_order ? inr(c.min_order) : "—"}</td>
              <td><input type="checkbox" checked={c.active} onChange={(e) => toggle(c.code, e.target.checked)} aria-label={`${c.code} active`} /></td>
              <td className="text-right"><button onClick={() => remove(c.code)} aria-label={`Delete ${c.code}`}><Trash2 className="h-4 w-4" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
