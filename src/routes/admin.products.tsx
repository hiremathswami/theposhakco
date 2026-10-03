import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { img } from "@/lib/catalog";

export const Route = createFileRoute("/admin/products")({ component: Products });

type Row = {
  id: string; title: string; slug: string; price: number; compare_at_price: number | null;
  stock: number; status: string; images: string[]; category: string; gender: string;
  is_new: boolean; is_bestseller: boolean;
};

function Products() {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,title,slug,price,compare_at_price,stock,status,images,category,gender,is_new,is_bestseller")
        .order("sort_order");
      if (error) throw error;
      return data as Row[];
    },
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  async function save(id: string, patch: Partial<Row>) {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) return void toast.error("Could not save: " + error.message);
    toast.success("Saved");
    refresh();
  }

  const num = (v: string) => Math.max(0, parseInt(v, 10) || 0);
  const cell = "w-24 border border-border bg-background px-2 py-1.5 text-sm";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Products</h1>
        <button onClick={() => setAdding((a) => !a)} className="btn-solid !py-2">{adding ? "Close" : "Add product"}</button>
      </div>
      {adding && <NewProduct onDone={() => { setAdding(false); refresh(); }} />}
      <p className="mt-4 text-sm text-muted-foreground">Edit a price or stock number and click away to save. Hidden products don't show in the shop.</p>
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left"><th className="py-2">Product</th><th>Price ₹</th><th>MRP ₹</th><th>Stock</th><th>Badges</th><th>Visible</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="flex items-center gap-3 py-2">
                  <img src={img(p.images[0] ?? "")} alt="" className="h-12 w-10 bg-muted object-cover" />
                  <div><p className="font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{p.category} · {p.gender}</p></div>
                </td>
                <td><input aria-label={`${p.title} price`} defaultValue={p.price} inputMode="numeric" className={cell}
                  onBlur={(e) => num(e.target.value) !== p.price && num(e.target.value) > 0 && save(p.id, { price: num(e.target.value) })} /></td>
                <td><input aria-label={`${p.title} MRP`} defaultValue={p.compare_at_price ?? ""} inputMode="numeric" placeholder="—" className={cell}
                  onBlur={(e) => { const v = e.target.value ? num(e.target.value) : null; if (v !== p.compare_at_price) save(p.id, { compare_at_price: v }); }} /></td>
                <td><input aria-label={`${p.title} stock`} defaultValue={p.stock} inputMode="numeric" className={`${cell} ${p.stock <= 5 ? "border-blood text-blood" : ""}`}
                  onBlur={(e) => num(e.target.value) !== p.stock && save(p.id, { stock: num(e.target.value) })} /></td>
                <td className="space-x-3 whitespace-nowrap">
                  <label><input type="checkbox" checked={p.is_new} onChange={(e) => save(p.id, { is_new: e.target.checked })} /> New</label>
                  <label><input type="checkbox" checked={p.is_bestseller} onChange={(e) => save(p.id, { is_bestseller: e.target.checked })} /> Best</label>
                </td>
                <td><input type="checkbox" aria-label={`${p.title} visible`} checked={p.status === "active"} onChange={(e) => save(p.id, { status: e.target.checked ? "active" : "hidden" })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewProduct({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ title: "", price: "", stock: "50", category: "Oversized Tee", gender: "unisex", description: "", image: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = parseInt(f.price, 10);
    if (f.title.trim().length < 2 || !price) return void toast.error("Add a name and price.");
    if (f.image && !/^https:\/\//.test(f.image)) return void toast.error("Image must be an https:// link.");
    setBusy(true);
    const slug = `${f.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("products").insert({
      title: f.title.trim(), slug, price, stock: parseInt(f.stock, 10) || 0, category: f.category,
      gender: f.gender, description: f.description.trim(), images: f.image ? [f.image] : ["p-signature"],
      colors: [{ name: "Black", hex: "#1a1a1a" }], is_new: true, sort_order: 999,
    });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Product added");
    onDone();
  }

  const i = "border border-border bg-background px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 border border-border bg-card p-5 md:grid-cols-3">
      <input placeholder="Product name" value={f.title} onChange={set("title")} maxLength={100} className={i} aria-label="Name" />
      <input placeholder="Price ₹" value={f.price} onChange={set("price")} inputMode="numeric" className={i} aria-label="Price" />
      <input placeholder="Stock" value={f.stock} onChange={set("stock")} inputMode="numeric" className={i} aria-label="Stock" />
      <input placeholder="Category" value={f.category} onChange={set("category")} maxLength={60} className={i} aria-label="Category" />
      <select value={f.gender} onChange={set("gender")} className={i} aria-label="Gender">
        <option value="unisex">Unisex</option><option value="men">Men</option><option value="women">Women</option>
      </select>
      <input placeholder="Image link (https://…, optional)" value={f.image} onChange={set("image")} className={i} aria-label="Image link" />
      <textarea placeholder="Description" value={f.description} onChange={set("description")} rows={2} maxLength={1000} className={`${i} md:col-span-3`} aria-label="Description" />
      <button disabled={busy} className="btn-solid !py-2 md:col-span-3">{busy ? "Saving…" : "Save product"}</button>
    </form>
  );
}
