import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { productsQuery } from "@/lib/queries";
import { recommendOutfit, type StylistResult } from "@/lib/stylist.functions";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/stylist")({
  head: () => ({
    meta: [
      { title: "AI Stylist — ThePoshakCo" },
      { name: "description", content: "Describe your occasion and style, and get ThePoshakCo pieces picked just for you." },
      { property: "og:title", content: "AI Stylist — ThePoshakCo" },
      { property: "og:description", content: "Tell us the occasion. We'll put the look together from our collection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StylistPage,
});

const IDEAS = [
  "College fest this weekend, want to stand out",
  "Casual Sunday brunch with friends",
  "Weekend road trip to Goa",
  "First date at a rooftop café",
];

function StylistPage() {
  const recommend = useServerFn(recommendOutfit);
  const { data: products = [] } = useQuery(productsQuery());
  const [occasion, setOccasion] = useState("");
  const [style, setStyle] = useState("");
  const [gender, setGender] = useState<"any" | "men" | "women">("any");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StylistResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (occasion.trim().length < 3 || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const b = parseInt(budget, 10);
      setResult(await recommend({ data: { occasion, style, gender, budget: Number.isFinite(b) ? b : null } }));
    } catch {
      setResult({ ok: false, message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const field = "w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";

  return (
    <main className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10">
      <p className="eyebrow text-primary">The Poshak Stylist</p>
      <h1 className="mt-3 font-display text-4xl md:text-6xl">Tell us the occasion.<br />We'll style the look.</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Describe where you're headed and how you like to dress. Our AI stylist picks pieces from the current collection for you.
      </p>

      <form onSubmit={submit} className="mt-10 grid gap-5 border border-border p-6 md:grid-cols-2 md:p-8">
        <label className="md:col-span-2">
          <span className="eyebrow">The occasion</span>
          <textarea
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Friend's birthday at a rooftop café, warm evening"
            className={`${field} mt-2 resize-none`}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {IDEAS.map((i) => (
              <button key={i} type="button" onClick={() => setOccasion(i)} className="border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary">
                {i}
              </button>
            ))}
          </div>
        </label>
        <label className="md:col-span-2">
          <span className="eyebrow">Your style</span>
          <input value={style} onChange={(e) => setStyle(e.target.value)} maxLength={500} placeholder="e.g. oversized fits, earthy colours, minimal prints" className={`${field} mt-2`} />
        </label>
        <label>
          <span className="eyebrow">Shopping for</span>
          <select value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className={`${field} mt-2`}>
            <option value="any">Anyone</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </label>
        <label>
          <span className="eyebrow">Max budget per piece (₹)</span>
          <input value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Optional" className={`${field} mt-2`} />
        </label>
        <div className="md:col-span-2">
          <button type="submit" disabled={loading || occasion.trim().length < 3} className="btn-solid inline-flex items-center gap-2 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Styling your look…" : "Style me"}
          </button>
        </div>
      </form>

      <section aria-live="polite" className="mt-14">
        {result && !result.ok && <p className="border border-blood/40 p-4 text-sm text-blood">{result.message}</p>}
        {result?.ok && (
          <>
            <h2 className="font-display text-3xl">Your look</h2>
            {result.summary && <p className="mt-2 max-w-2xl text-muted-foreground">{result.summary}</p>}
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
              {result.picks.map((pick) => {
                const p = bySlug.get(pick.slug);
                if (!p) return null;
                return (
                  <div key={pick.slug}>
                    <ProductCard p={p} showAdd />
                    <p className="mt-3 border-l-2 border-primary pl-3 text-sm italic text-muted-foreground">{pick.reason}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
