import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Instagram, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { CONTACT } from "@/lib/contact";
import { useLegal, legalQuery } from "@/lib/use-legal";
import { POLICIES } from "@/lib/legal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Grievance Redressal — ThePoshakCo" },
      { name: "description", content: "Reach ThePoshakCo support by email, phone or WhatsApp, and contact our Grievance Officer." },
      { property: "og:title", content: "Contact & Grievance Redressal — ThePoshakCo" },
      { property: "og:description", content: "Customer support and grievance redressal for ThePoshakCo shoppers in India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(legalQuery).catch(() => null),
  errorComponent: () => <p className="p-20 text-center">Could not load this page. Please refresh.</p>,
  notFoundComponent: () => <p className="p-20 text-center">Page not found.</p>,
  component: ContactPage,
});

function ContactPage() {
  const { settings: s } = useLegal();
  const [f, setF] = useState({ name: "", order: "", subject: "Order support", message: "" });
  const mail = `mailto:${s.support_email}?subject=${encodeURIComponent(`${f.subject}${f.order ? ` — ${f.order}` : ""}`)}&body=${encodeURIComponent(`Name: ${f.name}\nOrder: ${f.order || "—"}\n\n${f.message}`)}`;
  const grievanceMail = `mailto:${s.grievance_officer_email}?subject=${encodeURIComponent("Grievance")}`;
  const i = "w-full border border-border bg-background px-3 py-2.5 text-sm";

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
      <p className="eyebrow text-muted-foreground">We're here to help</p>
      <h1 className="mt-3 font-display text-4xl md:text-6xl">Contact & Grievance Redressal</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">Questions about an order, sizing, returns or anything else — write to us and we'll reply within 1–2 business days (Mon–Sat, 10am–7pm IST).</p>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section className="space-y-6">
          <h2 className="font-display text-2xl">Customer support</h2>
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3"><Mail className="h-5 w-5 shrink-0" /><a href={`mailto:${s.support_email}`} className="underline underline-offset-2">{s.support_email}</a></li>
            <li className="flex gap-3"><Phone className="h-5 w-5 shrink-0" /><span>{s.support_phone} · <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="underline underline-offset-2">WhatsApp us</a></span></li>
            <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0" /><span>{s.registered_address}</span></li>
            <li className="flex gap-3"><Instagram className="h-5 w-5 shrink-0" /><a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="underline underline-offset-2">@theposhak.co</a></li>
          </ul>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-border pt-6 text-sm">
            <dt className="text-muted-foreground">Legal name</dt><dd>{s.legal_name}</dd>
            {s.gstin && <><dt className="text-muted-foreground">GSTIN</dt><dd>{s.gstin}</dd></>}
          </dl>

          <form onSubmit={(e) => { e.preventDefault(); window.location.href = mail; }} className="space-y-3 border border-border p-5">
            <h3 className="font-medium">Send us a message</h3>
            <input required placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={100} className={i} aria-label="Your name" />
            <input placeholder="Order number (optional)" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} maxLength={30} className={i} aria-label="Order number" />
            <select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={i} aria-label="Topic">
              {["Order support", "Returns & exchanges", "Cancellation", "Payment", "Sizing", "Other"].map((o) => <option key={o}>{o}</option>)}
            </select>
            <textarea required placeholder="How can we help?" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={4} maxLength={2000} className={i} aria-label="Message" />
            <button className="btn-solid w-full">Write email</button>
            <p className="text-xs text-muted-foreground">Opens your email app with the message filled in.</p>
          </form>
        </section>

        <section className="h-fit border border-border bg-card p-6 md:p-8">
          <ShieldCheck className="h-6 w-6 text-forest" />
          <h2 className="mt-3 font-display text-2xl">Grievance Officer</h2>
          <p className="mt-2 text-sm text-muted-foreground">In line with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000.</p>
          <dl className="mt-5 space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Name</dt><dd>{s.grievance_officer_name}</dd></div>
            <div><dt className="text-muted-foreground">Email</dt><dd><a href={grievanceMail} className="underline underline-offset-2">{s.grievance_officer_email}</a></dd></div>
            <div><dt className="text-muted-foreground">Phone</dt><dd>{s.support_phone}</dd></div>
            <div><dt className="text-muted-foreground">Address</dt><dd>{s.registered_address}</dd></div>
          </dl>
          <h3 className="mt-6 font-medium">How we handle complaints</h3>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
            <li>Email the Grievance Officer with your name, order number and details of the issue.</li>
            <li>We acknowledge your complaint within 48 hours.</li>
            <li>We aim to resolve it within 30 days of receipt.</li>
            <li>If unresolved, you may approach the National Consumer Helpline (1915) or the appropriate consumer commission. Courts in {s.jurisdiction_city} have jurisdiction, subject to consumer law.</li>
          </ol>
          <div className="mt-6 border-t border-border pt-5 text-sm">
            <p className="eyebrow mb-2 text-muted-foreground">Our policies</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {POLICIES.map((p) => <li key={p.slug}><Link to={`/${p.slug}`} className="hover:underline">{p.title}</Link></li>)}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
