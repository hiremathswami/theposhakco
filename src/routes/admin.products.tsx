import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, X, Link2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { img, type ProductColor } from "@/lib/catalog";

export const Route = createFileRoute("/admin/products")({ component: Products });

type Row = {
  id: string; title: string; slug: string; subtitle: string | null; description: string; fabric: string | null; care: string | null;
  price: number; compare_at_price: number | null; stock: number; status: string; images: string[]; category: string; gender: string;
  sizes: string[]; colors: ProductColor[]; is_new: boolean; is_bestseller: boolean; is_featured: boolean;
};

const COLS = "id,title,slug,subtitle,description,fabric,care,price,compare_at_price,stock,status,images,category,gender,sizes,colors,is_new,is_bestseller,is_featured";

function Products() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select(COLS).order("sort_order");
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  }

  async function save(id: string, patch: Partial<Row>) {
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) return void toast.error("Could not save: " + error.message);
    toast.success("Saved");
    refresh();
  }

  async function remove(p: Row) {
    if (!confirm(`Delete "${p.title}"? This cannot be undone. Past orders keep their details.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return void toast.error("Could not delete: " + error.message);
    toast.success("Product deleted");
    refresh();
  }

  const num = (v: string) => Math.max(0, parseInt(v, 10) || 0);
  const cell = "w-24 border border-border bg-background px-2 py-1.5 text-sm";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl">Products</h1>
        <button onClick={() => setEditing("new")} className="btn-solid !py-2">Add product</button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Quick-edit price or stock and click away to save, or use the pencil to edit everything. Hidden products don't show in the shop.</p>
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left"><th className="py-2">Product</th><th>Price ₹</th><th>MRP ₹</th><th>Stock</th><th>Badges</th><th>Visible</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="flex items-center gap-3 py-2">
                  <img src={img(p.images[0] ?? "")} alt="" className="h-12 w-10 bg-muted object-cover" />
                  <div><p className="font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{p.category} · {p.gender} · {p.images.length} photo{p.images.length === 1 ? "" : "s"}</p></div>
                </td>
                <td><input key={`pr${p.price}`} aria-label={`${p.title} price`} defaultValue={p.price} inputMode="numeric" className={cell}
                  onBlur={(e) => num(e.target.value) !== p.price && num(e.target.value) > 0 && save(p.id, { price: num(e.target.value) })} /></td>
                <td><input key={`m${p.compare_at_price}`} aria-label={`${p.title} MRP`} defaultValue={p.compare_at_price ?? ""} inputMode="numeric" placeholder="—" className={cell}
                  onBlur={(e) => { const v = e.target.value ? num(e.target.value) : null; if (v !== p.compare_at_price) save(p.id, { compare_at_price: v }); }} /></td>
                <td><input key={`s${p.stock}`} aria-label={`${p.title} stock`} defaultValue={p.stock} inputMode="numeric" className={`${cell} ${p.stock <= 5 ? "border-blood text-blood" : ""}`}
                  onBlur={(e) => num(e.target.value) !== p.stock && save(p.id, { stock: num(e.target.value) })} /></td>
                <td className="space-x-3 whitespace-nowrap">
                  <label><input type="checkbox" checked={p.is_new} onChange={(e) => save(p.id, { is_new: e.target.checked })} /> New</label>
                  <label><input type="checkbox" checked={p.is_bestseller} onChange={(e) => save(p.id, { is_bestseller: e.target.checked })} /> Best</label>
                </td>
                <td><input type="checkbox" aria-label={`${p.title} visible`} checked={p.status === "active"} onChange={(e) => save(p.id, { status: e.target.checked ? "active" : "hidden" })} /></td>
                <td className="whitespace-nowrap text-right">
                  <button onClick={() => setEditing(p)} aria-label={`Edit ${p.title}`} className="p-2 hover:text-forest"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p)} aria-label={`Delete ${p.title}`} className="p-2 hover:text-blood"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <ProductForm key={editing === "new" ? "new" : editing.id} product={editing === "new" ? null : editing}
        onClose={() => setEditing(null)} onDone={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const PRESET_COLORS: ProductColor[] = [
  { name: "Black", hex: "#1a1a1a" }, { name: "White", hex: "#f5f2ea" }, { name: "Forest", hex: "#1f3b2d" },
  { name: "Sand", hex: "#d8c7a6" }, { name: "Clay", hex: "#b5643c" }, { name: "Maroon", hex: "#6b1e1e" }, { name: "Navy", hex: "#1d2840" },
];

function ProductForm({ product, onClose, onDone }: { product: Row | null; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({
    title: product?.title ?? "", subtitle: product?.subtitle ?? "", price: String(product?.price ?? ""),
    mrp: product?.compare_at_price ? String(product.compare_at_price) : "", stock: String(product?.stock ?? 50),
    category: product?.category ?? "Oversized Tee", gender: product?.gender ?? "unisex",
    description: product?.description ?? "", fabric: product?.fabric ?? "", care: product?.care ?? "",
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? ["S", "M", "L", "XL", "XXL"]);
  const [colors, setColors] = useState<ProductColor[]>(product?.colors?.length ? product.colors : [PRESET_COLORS[0]!]);
  const [flags, setFlags] = useState({ is_new: product?.is_new ?? true, is_bestseller: product?.is_bestseller ?? false, is_featured: product?.is_featured ?? false, active: (product?.status ?? "active") === "active" });
  const [link, setLink] = useState("");
  const [custom, setCustom] = useState({ name: "", hex: "#888888" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is larger than 5 MB`); continue; }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
      if (error) { toast.error("Upload failed: " + error.message); continue; }
      setImages((imgs) => [...imgs, `/api/public/product-image/${path}`]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function addLink() {
    const v = link.trim();
    if (!/^https:\/\/\S+$/.test(v)) return void toast.error("Image link must start with https://");
    setImages((imgs) => [...imgs, v]);
    setLink("");
  }

  const move = (i: number, to: number) => setImages((imgs) => { const n = [...imgs]; const [x] = n.splice(i, 1); n.splice(to, 0, x!); return n; });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = parseInt(f.price, 10);
    const mrp = f.mrp ? parseInt(f.mrp, 10) : null;
    if (f.title.trim().length < 2 || !price || price <= 0) return void toast.error("Add a name and a valid price.");
    if (mrp !== null && mrp <= price) return void toast.error("MRP should be higher than the price (or leave it empty).");
    if (!sizes.length) return void toast.error("Pick at least one size.");
    if (!colors.length) return void toast.error("Add at least one colour.");
    setBusy(true);
    const payload = {
      title: f.title.trim(), subtitle: f.subtitle.trim() || null, price, compare_at_price: mrp,
      stock: Math.max(0, parseInt(f.stock, 10) || 0), category: f.category.trim() || "Tee", gender: f.gender,
      description: f.description.trim(), fabric: f.fabric.trim() || null, care: f.care.trim() || null,
      images: images.length ? images : ["p-signature"], sizes, colors,
      is_new: flags.is_new, is_bestseller: flags.is_bestseller, is_featured: flags.is_featured, status: flags.active ? "active" : "hidden",
    };
    const res = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert({
          ...payload, sort_order: 999,
          slug: `${f.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 6)}`,
        });
    setBusy(false);
    if (res.error) return void toast.error(res.error.message);
    toast.success(product ? "Product updated" : "Product added");
    onDone();
  }

  const i = "w-full border border-border bg-background px-3 py-2 text-sm";
  const lbl = "eyebrow mb-1 block text-muted-foreground";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal/40" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-2xl overflow-y-auto bg-background p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">{product ? "Edit product" : "New product"}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <section className="mt-6">
          <span className={lbl}>Photos (first one is the cover)</span>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((src, idx) => (
              <div key={src + idx} className="group relative aspect-[4/5] border border-border bg-muted">
                <img src={img(src)} alt="" className="h-full w-full object-cover" />
                {idx === 0 && <span className="absolute left-1 top-1 bg-forest px-1.5 py-0.5 text-[10px] uppercase text-ivory">Cover</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-background/90 p-1 text-xs">
                  {idx > 0 ? <button type="button" onClick={() => move(idx, 0)} title="Make cover" aria-label="Make cover"><Star className="h-3.5 w-3.5" /></button> : <span />}
                  <span className="space-x-1">
                    {idx > 0 && <button type="button" onClick={() => move(idx, idx - 1)} aria-label="Move left">←</button>}
                    {idx < images.length - 1 && <button type="button" onClick={() => move(idx, idx + 1)} aria-label="Move right">→</button>}
                  </span>
                  <button type="button" onClick={() => setImages(images.filter((_, j) => j !== idx))} aria-label="Remove photo" className="text-blood"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-2 border border-dashed border-border text-xs text-muted-foreground hover:border-forest hover:text-forest">
              <Upload className="h-5 w-5" /> {uploading ? "Uploading…" : "Upload photos"}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="…or paste an image link (https://)" aria-label="Image link"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} className={`${i} pl-9`} />
            </div>
            <button type="button" onClick={addLink} className="btn-outline !py-2">Add link</button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP up to 5 MB each.</p>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className={lbl}>Name</span><input value={f.title} onChange={set("title")} maxLength={100} className={i} /></label>
          <label className="sm:col-span-2"><span className={lbl}>Short tagline</span><input value={f.subtitle} onChange={set("subtitle")} maxLength={140} placeholder="e.g. Heavyweight oversized tee" className={i} /></label>
          <label><span className={lbl}>Price ₹</span><input value={f.price} onChange={set("price")} inputMode="numeric" className={i} /></label>
          <label><span className={lbl}>MRP ₹ (optional, shows discount)</span><input value={f.mrp} onChange={set("mrp")} inputMode="numeric" className={i} /></label>
          <label><span className={lbl}>Stock</span><input value={f.stock} onChange={set("stock")} inputMode="numeric" className={i} /></label>
          <label><span className={lbl}>For</span>
            <select value={f.gender} onChange={set("gender")} className={i}><option value="unisex">Unisex</option><option value="men">Men</option><option value="women">Women</option></select>
          </label>
          <label className="sm:col-span-2"><span className={lbl}>Category</span><input value={f.category} onChange={set("category")} maxLength={60} list="cats" className={i} />
            <datalist id="cats"><option value="Oversized Tee" /><option value="Graphic Tee" /><option value="Essential Tee" /></datalist>
          </label>
        </section>

        <section className="mt-6">
          <span className={lbl}>Sizes</span>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((s) => {
              const on = sizes.includes(s);
              return <button type="button" key={s} onClick={() => setSizes(on ? sizes.filter((x) => x !== s) : ALL_SIZES.filter((x) => x === s || sizes.includes(x)))}
                className={`min-w-11 border px-3 py-1.5 text-sm ${on ? "border-forest bg-forest text-ivory" : "border-border"}`}>{s}</button>;
            })}
          </div>
        </section>

        <section className="mt-6">
          <span className={lbl}>Colours</span>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <span key={c.name} className="flex items-center gap-2 border border-border px-2 py-1 text-sm">
                <span className="h-4 w-4 border border-border" style={{ background: c.hex }} /> {c.name}
                <button type="button" onClick={() => setColors(colors.filter((x) => x.name !== c.name))} aria-label={`Remove ${c.name}`}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_COLORS.filter((p) => !colors.some((c) => c.name === p.name)).map((p) => (
              <button type="button" key={p.name} onClick={() => setColors([...colors, p])} className="flex items-center gap-1.5 border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
                <span className="h-3 w-3" style={{ background: p.hex }} /> + {p.name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input type="color" value={custom.hex} onChange={(e) => setCustom({ ...custom, hex: e.target.value })} aria-label="Custom colour" className="h-9 w-10 border border-border" />
            <input value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} placeholder="Custom colour name" maxLength={30} className={`${i} max-w-xs`} />
            <button type="button" className="btn-outline !py-2" onClick={() => {
              const name = custom.name.trim();
              if (!name || colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
              setColors([...colors, { name, hex: custom.hex }]); setCustom({ name: "", hex: "#888888" });
            }}>Add</button>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          <label><span className={lbl}>Description</span><textarea value={f.description} onChange={set("description")} rows={4} maxLength={2000} className={i} /></label>
          <label><span className={lbl}>Fabric</span><input value={f.fabric} onChange={set("fabric")} maxLength={200} placeholder="e.g. 240 GSM 100% combed cotton" className={i} /></label>
          <label><span className={lbl}>Care</span><input value={f.care} onChange={set("care")} maxLength={200} placeholder="e.g. Cold wash inside out" className={i} /></label>
        </section>

        <section className="mt-6 flex flex-wrap gap-5 text-sm">
          <label><input type="checkbox" checked={flags.active} onChange={(e) => setFlags({ ...flags, active: e.target.checked })} /> Visible in shop</label>
          <label><input type="checkbox" checked={flags.is_new} onChange={(e) => setFlags({ ...flags, is_new: e.target.checked })} /> New</label>
          <label><input type="checkbox" checked={flags.is_bestseller} onChange={(e) => setFlags({ ...flags, is_bestseller: e.target.checked })} /> Bestseller</label>
          <label><input type="checkbox" checked={flags.is_featured} onChange={(e) => setFlags({ ...flags, is_featured: e.target.checked })} /> Featured</label>
        </section>

        <div className="sticky bottom-0 mt-8 flex gap-3 border-t border-border bg-background py-4">
          <button type="button" onClick={onClose} className="btn-outline flex-1 !py-2">Cancel</button>
          <button disabled={busy || uploading} className="btn-solid flex-1 !py-2">{busy ? "Saving…" : product ? "Save changes" : "Add product"}</button>
        </div>
      </form>
    </div>
  );
}
