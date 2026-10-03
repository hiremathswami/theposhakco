import privacy from "@/content/policies/privacy-policy.md?raw";
import terms from "@/content/policies/terms-and-conditions.md?raw";
import shipping from "@/content/policies/shipping-policy.md?raw";
import returns from "@/content/policies/returns-refunds.md?raw";
import cancellation from "@/content/policies/cancellation-policy.md?raw";
import cookie from "@/content/policies/cookie-policy.md?raw";

export type StoreSettings = {
  legal_name: string;
  registered_address: string;
  gstin: string;
  support_email: string;
  support_phone: string;
  grievance_officer_name: string;
  grievance_officer_email: string;
  free_shipping_threshold: number;
  return_window_days: number;
  refund_timeline_days: number;
  shipping_time: string;
  jurisdiction_city: string;
  policy_version: string;
  policy_updated_at: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  legal_name: "ThePoshakCo",
  registered_address: "Mahalaxmi Chambers, Railway Colony, Shahupuri, Kolhapur, Maharashtra, India",
  gstin: "",
  support_email: "ThePoshakco@gmail.com",
  support_phone: "+91 88883 15454",
  grievance_officer_name: "Grievance Officer, ThePoshakCo",
  grievance_officer_email: "ThePoshakco@gmail.com",
  free_shipping_threshold: 999,
  return_window_days: 7,
  refund_timeline_days: 7,
  shipping_time: "4–7 business days",
  jurisdiction_city: "Kolhapur, Maharashtra",
  policy_version: "1.0",
  policy_updated_at: new Date(0).toISOString(),
};

export const POLICIES = [
  { slug: "privacy-policy", title: "Privacy Policy", body: privacy },
  { slug: "terms-and-conditions", title: "Terms & Conditions", body: terms },
  { slug: "shipping-policy", title: "Shipping Policy", body: shipping },
  { slug: "returns-refunds", title: "Returns & Refunds Policy", body: returns },
  { slug: "cancellation-policy", title: "Cancellation Policy", body: cancellation },
  { slug: "cookie-policy", title: "Cookie Policy", body: cookie },
] as const;

export type PolicySlug = (typeof POLICIES)[number]["slug"];

export const TOKENS = [
  "legal_name", "address", "gstin", "support_email", "support_phone", "grievance_name", "grievance_email",
  "free_shipping", "shipping_fee", "return_days", "refund_days", "shipping_time", "jurisdiction", "last_updated", "website",
] as const;

export function fillTokens(text: string, s: StoreSettings): string {
  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const map: Record<string, string> = {
    legal_name: s.legal_name,
    address: s.registered_address,
    gstin: s.gstin || "Not applicable",
    support_email: s.support_email,
    support_phone: s.support_phone,
    grievance_name: s.grievance_officer_name,
    grievance_email: s.grievance_officer_email,
    free_shipping: inr(s.free_shipping_threshold),
    shipping_fee: inr(79),
    return_days: String(s.return_window_days),
    refund_days: String(s.refund_timeline_days),
    shipping_time: s.shipping_time,
    jurisdiction: s.jurisdiction_city,
    last_updated: new Date(s.policy_updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    website: "theposhakco.lovable.app",
  };
  return text.replace(/\{\{(\w+)\}\}/g, (m, k: string) => map[k] ?? m);
}

export type Block = { type: "h3" | "p" | "ul"; lines: string[] };
export type Section = { id: string; title: string; blocks: Block[] };

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|\s|\(|-)([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase()).replace(/\bAnd\b/g, "and");

/** Parses the plain-text policy format: "1. HEADING", "A. Subheading", "- bullet", blank-line paragraphs. */
export function parsePolicy(text: string): { intro: Block[]; sections: Section[] } {
  const lines = text.replace(/\r/g, "").split("\n");
  const intro: Block[] = [];
  const sections: Section[] = [];
  let target = intro;
  let cur: Block | null = null;
  const flush = () => { if (cur) target.push(cur); cur = null; };
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (idx === 0 && /^[A-Z &]+$/.test(line)) return;
    if (/^Last updated:/i.test(line)) return;
    if (!line) return flush();
    const h = line.match(/^(\d+)\.\s+(.+)$/);
    if (h && h[2] === h[2]!.toUpperCase()) {
      flush();
      const sec: Section = { id: `s${h[1]}`, title: `${h[1]}. ${titleCase(h[2]!)}`, blocks: [] };
      sections.push(sec);
      target = sec.blocks;
      return;
    }
    if (/^[A-Z]\.\s+\S/.test(line) && line.length < 80) {
      flush();
      target.push({ type: "h3", lines: [line] });
      return;
    }
    if (line.startsWith("- ")) {
      if (cur?.type !== "ul") { flush(); cur = { type: "ul", lines: [] }; }
      cur!.lines.push(line.slice(2));
      return;
    }
    if (cur?.type !== "p") { flush(); cur = { type: "p", lines: [] }; }
    cur!.lines.push(line);
  });
  flush();
  return { intro, sections };
}
