import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Search, Printer } from "lucide-react";
import { POLICIES, fillTokens, parsePolicy, type Block, type PolicySlug } from "@/lib/legal";
import { useLegal } from "@/lib/use-legal";

const PATHS = POLICIES.map((p) => `/${p.slug}`);

function inline(text: string, q: string): ReactNode[] {
  const parts = text.split(/(\/[a-z-]+(?=[\s).,]|$)|[\w.+-]+@[\w-]+\.[\w.]+)/g);
  return parts.map((part, i) => {
    if (PATHS.includes(part)) {
      const p = POLICIES.find((x) => `/${x.slug}` === part)!;
      return <Link key={i} to={part} className="underline underline-offset-2">{p.title}</Link>;
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part)) return <a key={i} href={`mailto:${part}`} className="underline underline-offset-2">{part}</a>;
    return <Highlight key={i} text={part} q={q} />;
  });
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return <>{text.split(re).map((t, i) => (i % 2 ? <mark key={i} className="bg-gold/40 text-foreground">{t}</mark> : t))}</>;
}

function Blocks({ blocks, q }: { blocks: Block[]; q: string }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === "h3" ? <h3 key={i} className="mt-6 font-medium">{inline(b.lines[0]!, q)}</h3>
        : b.type === "ul" ? <ul key={i} className="mt-3 list-disc space-y-1.5 pl-5">{b.lines.map((l, j) => <li key={j}>{inline(l, q)}</li>)}</ul>
        : <p key={i} className="mt-3">{b.lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l, q)}</span>)}</p>,
      )}
    </>
  );
}

export function PolicyPage({ slug }: { slug: PolicySlug }) {
  const { settings, overrides } = useLegal();
  const policy = POLICIES.find((p) => p.slug === slug)!;
  const [q, setQ] = useState("");
  const doc = useMemo(() => parsePolicy(fillTokens(overrides[slug] ?? policy.body, settings)), [overrides, slug, policy.body, settings]);
  const needle = q.trim().toLowerCase();
  const text = (bs: Block[]) => bs.flatMap((b) => b.lines).join(" ").toLowerCase();
  const visible = needle ? doc.sections.filter((s) => s.title.toLowerCase().includes(needle) || text(s.blocks).includes(needle)) : doc.sections;
  const updated = new Date(settings.policy_updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground"><Link to="/">Home</Link> / Legal</nav>
      <h1 className="mt-3 font-display text-4xl md:text-6xl">{policy.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated {updated} · Version {settings.policy_version}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <label className="relative block">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this policy" aria-label="Search this policy"
              className="w-full border border-border bg-background py-2 pl-9 pr-3 text-sm" />
          </label>
          <nav aria-label="Sections" className="mt-5 hidden max-h-[60vh] overflow-y-auto lg:block">
            <ul className="space-y-1.5 text-sm">
              {visible.map((s) => <li key={s.id}><a href={`#${s.id}`} className="text-muted-foreground hover:text-foreground">{s.title}</a></li>)}
            </ul>
          </nav>
          <div className="mt-6 border-t border-border pt-5 text-sm">
            <p className="eyebrow mb-2 text-muted-foreground">Other policies</p>
            <ul className="space-y-1.5">
              {POLICIES.filter((p) => p.slug !== slug).map((p) => <li key={p.slug}><Link to={`/${p.slug}`} className="hover:underline">{p.title}</Link></li>)}
              <li><Link to="/contact" className="hover:underline">Contact & Grievances</Link></li>
            </ul>
            <button type="button" onClick={() => window.print()} className="mt-5 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          </div>
        </aside>

        <article className="max-w-[72ch] text-[15px] leading-relaxed text-foreground/90">
          {!needle && <Blocks blocks={doc.intro} q="" />}
          {needle && <p className="text-sm text-muted-foreground">{visible.length} section{visible.length === 1 ? "" : "s"} match “{q}”.</p>}
          {visible.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-t border-border pt-8 mt-8 first:mt-6">
              <h2 className="font-display text-2xl"><Highlight text={s.title} q={needle} /></h2>
              <Blocks blocks={s.blocks} q={needle} />
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}

export function policyHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — ThePoshakCo` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — ThePoshakCo` },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
