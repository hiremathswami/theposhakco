import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLegal } from "@/lib/use-legal";
import { POLICIES, TOKENS, type PolicySlug, type StoreSettings } from "@/lib/legal";

export const Route = createFileRoute("/admin/legal")({ component: Legal });

type Editable = Omit<StoreSettings, "policy_updated_at">;
const FIELDS: { k: keyof Editable; label: string; type?: "number" | "textarea"; hint?: string }[] = [
  { k: "legal_name", label: "Legal business name" },
  { k: "registered_address", label: "Registered address", type: "textarea" },
  { k: "gstin", label: "GSTIN", hint: "Leave empty if not registered" },
  { k: "support_email", label: "Customer support email" },
  { k: "support_phone", label: "Support phone number" },
  { k: "grievance_officer_name", label: "Grievance officer name" },
  { k: "grievance_officer_email", label: "Grievance officer email" },
  { k: "free_shipping_threshold", label: "Free-shipping threshold (₹)", type: "number", hint: "Also used in cart and checkout" },
  { k: "return_window_days", label: "Return window (days)", type: "number" },
  { k: "refund_timeline_days", label: "Refund timeline (business days)", type: "number" },
  { k: "shipping_time", label: "Standard shipping time" },
  { k: "jurisdiction_city", label: "Jurisdiction city" },
  { k: "policy_version", label: "Policy version", hint: "Change this when you update a policy — it's saved with every new order" },
];

function Legal() {
  const qc = useQueryClient();
  const { settings, overrides, isLoading } = useLegal();
  const [f, setF] = useState<Editable | null>(null);
  const [slug, setSlug] = useState<PolicySlug>("privacy-policy");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!isLoading && !f) { const { policy_updated_at: _p, ...rest } = settings; setF(rest); } }, [isLoading, settings, f]);
  useEffect(() => { setBody(overrides[slug] ?? POLICIES.find((p) => p.slug === slug)!.body); }, [slug, overrides]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["legal"] });

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    if (!/^\S+@\S+\.\S+$/.test(f.support_email) || !/^\S+@\S+\.\S+$/.test(f.grievance_officer_email)) return void toast.error("Check the email addresses.");
    if (f.gstin && !/^[0-9]{2}[A-Z0-9]{13}$/i.test(f.gstin.trim())) return void toast.error("GSTIN should be 15 characters.");
    setBusy(true);
    const versionChanged = f.policy_version.trim() !== settings.policy_version;
    const { error } = await supabase.from("store_settings").update({
      ...f, gstin: f.gstin.trim().toUpperCase(), policy_version: f.policy_version.trim() || "1.0",
      free_shipping_threshold: Math.max(0, Number(f.free_shipping_threshold) || 0),
      return_window_days: Math.max(0, Number(f.return_window_days) || 0),
      refund_timeline_days: Math.max(0, Number(f.refund_timeline_days) || 0),
      updated_at: new Date().toISOString(),
      ...(versionChanged ? { policy_updated_at: new Date().toISOString() } : {}),
    }).eq("id", 1);
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Store details saved");
    refresh();
  }

  async function savePolicy(reset = false) {
    setBusy(true);
    const { error } = reset
      ? await supabase.from("policy_pages").delete().eq("slug", slug)
      : await supabase.from("policy_pages").upsert({ slug, body, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(reset ? "Restored the default text" : "Policy saved — remember to bump the policy version");
    refresh();
  }

  if (!f) return <p className="text-muted-foreground">Loading…</p>;
  const i = "mt-1 w-full border border-border bg-background px-3 py-2 text-sm";
  return (
    <div className="space-y-12">
      <div>
        <h1 className="font-display text-4xl">Legal & policies</h1>
        <p className="mt-2 text-sm text-muted-foreground">These details fill in every policy page, the contact page and checkout.</p>
      </div>

      <form onSubmit={saveSettings} className="grid gap-4 border border-border bg-card p-5 md:grid-cols-2">
        {FIELDS.map(({ k, label, type, hint }) => (
          <label key={k} className={type === "textarea" ? "md:col-span-2" : ""}>
            <span className="eyebrow text-muted-foreground">{label}</span>
            {type === "textarea"
              ? <textarea value={String(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.value })} rows={2} maxLength={300} className={i} />
              : <input value={String(f[k])} inputMode={type === "number" ? "numeric" : undefined} maxLength={200}
                  onChange={(e) => setF({ ...f, [k]: type === "number" ? e.target.value.replace(/\D/g, "") : e.target.value })} className={i} />}
            {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
          </label>
        ))}
        <button disabled={busy} className="btn-solid !py-2 md:col-span-2">Save store details</button>
      </form>

      <section>
        <h2 className="font-display text-2xl">Edit policy text</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select value={slug} onChange={(e) => setSlug(e.target.value as PolicySlug)} className="border border-border bg-background px-3 py-2 text-sm" aria-label="Policy">
            {POLICIES.map((p) => <option key={p.slug} value={p.slug}>{p.title}{overrides[p.slug] ? " (edited)" : ""}</option>)}
          </select>
          <Link to={`/${slug}`} target="_blank" className="text-sm underline">View page</Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Format: “1. HEADING IN CAPITALS” starts a section, “A. Subheading” a sub-section, “- ” a bullet, a blank line a new paragraph.
          These words are replaced automatically: {TOKENS.map((t) => `{{${t}}}`).join(" ")}
        </p>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={24} maxLength={60000} aria-label="Policy text"
          className="mt-3 w-full border border-border bg-background p-3 font-mono text-xs leading-relaxed" />
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => savePolicy()} className="btn-solid !py-2">Save policy</button>
          {overrides[slug] && <button type="button" disabled={busy} onClick={() => confirm("Discard your edits and restore the default text?") && savePolicy(true)} className="btn-outline !py-2">Restore default</button>}
        </div>
      </section>
    </div>
  );
}
