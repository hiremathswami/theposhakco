import { Feather, Truck, Package, ShieldCheck } from "lucide-react";

const ITEMS = [
  { icon: Feather, t: "Premium fabrics", d: "Soft. Durable. Everyday ready." },
  { icon: Truck, t: "Pan India shipping", d: "Fast and reliable." },
  { icon: Package, t: "Easy returns", d: "Hassle free within 7 days." },
  { icon: ShieldCheck, t: "Secure payments", d: "100% safe and trusted." },
];

export function FeatureStrip() {
  return (
    <section aria-label="Why ThePoshakCo" className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-y-6 px-4 py-6 md:grid-cols-4 md:px-8">
        {ITEMS.map(({ icon: I, t, d }, i) => (
          <div key={t} className={`flex items-center justify-center gap-3 ${i > 0 ? "md:border-l md:border-border" : ""}`}>
            <I className="h-6 w-6 shrink-0" strokeWidth={1.25} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em]">{t}</p>
              <p className="text-xs text-muted-foreground">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
