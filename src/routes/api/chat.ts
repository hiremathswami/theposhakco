import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "@/lib/ai/run-id.server";
import { CONTACT } from "@/lib/contact";
import { DEFAULT_SETTINGS } from "@/lib/legal";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function catalogText(sb: ReturnType<typeof publicClient>) {
  const { data } = await sb
    .from("products")
    .select("slug,title,subtitle,gender,category,price,sizes,colors,stock,fabric")
    .eq("status", "active")
    .gt("stock", 0);
  return (data ?? [])
    .map((p) => `- ${p.title} (/product/${p.slug}) — ₹${p.price}, ${p.gender ?? ""} ${p.category ?? ""}, sizes ${(p.sizes ?? []).join("/")}, colours ${((p.colors as { name: string }[] | null) ?? []).map((c) => c.name).join("/")}. ${p.subtitle ?? ""} ${p.fabric ?? ""}`)
    .join("\n");
}

async function supportText(sb: ReturnType<typeof publicClient>) {
  const { data } = await sb.from("store_settings").select("*").eq("id", 1).maybeSingle();
  const s = { ...DEFAULT_SETTINGS, ...(data ?? {}) } as typeof DEFAULT_SETTINGS;
  return `Customer support (always share these exact details when asked or when you can't help):
- Email: ${s.support_email}
- Phone / WhatsApp: ${s.support_phone} — chat link ${CONTACT.whatsapp}
- Instagram: ${CONTACT.instagram}
- Address: ${s.registered_address}
- Hours: Mon–Sat, 10am–7pm IST; replies within 1–2 business days
- Grievance Officer: ${s.grievance_officer_name}, ${s.grievance_officer_email}
- Contact page: /contact
Store policies: free shipping on orders over ₹${s.free_shipping_threshold}, otherwise ₹79; express delivery ₹149; delivery in ${s.shipping_time}; returns within ${s.return_window_days} days; refunds within ${s.refund_timeline_days} days of receiving the return; payment by Cash on Delivery or UPI. Policy pages: /shipping-policy, /returns-refunds, /cancellation-policy, /privacy-policy, /terms-and-conditions.`;
}

const SYSTEM = (catalog: string, support: string) => `You are the shopping and customer-support assistant for ThePoshakCo, a premium Indian streetwear brand (oversized graphic tees inspired by art and culture). Be warm, concise and stylish. Prices are in INR.
${support}
You cannot see orders, payments or accounts. For order status, cancellations, damaged items, payment issues or anything needing a person, give the WhatsApp link as markdown [WhatsApp us](${CONTACT.whatsapp}) plus the support email, and ask them to include their order number.
Only recommend products from this in-stock catalog, and always link them as markdown, e.g. [The Lovers Tee](/product/the-lovers-tee). Never invent products, prices, contact details or policies. Recommend at most 4 items at a time.
Catalog:
${catalog}`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as { messages?: UIMessage[] } | null;
        if (!body || !Array.isArray(body.messages) || body.messages.length > 60) {
          return new Response("Invalid request", { status: 400 });
        }
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });
        const result = streamText({
          model: provider.responses("openai/gpt-6-astra"),
          system: await (async () => { const sb = publicClient(); const [c, s] = await Promise.all([catalogText(sb), supportText(sb)]); return SYSTEM(c, s); })(),
          messages: await convertToModelMessages(body.messages),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });
        return withLovableAiGatewayRunIdHeader(
          result.toUIMessageStreamResponse({ originalMessages: body.messages, sendReasoning: true }),
          runIdFetch,
        );
      },
    },
  },
});
