import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId, withLovableAiGatewayRunIdHeader } from "@/lib/ai/run-id.server";

async function catalogText() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient(process.env["SUPABASE_URL"]!, key, {
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
  const { data } = await sb
    .from("products")
    .select("slug,title,subtitle,gender,category,price,sizes,colors,stock,fabric")
    .eq("status", "active")
    .gt("stock", 0);
  return (data ?? [])
    .map((p) => `- ${p.title} (/product/${p.slug}) — ₹${p.price}, ${p.gender ?? ""} ${p.category ?? ""}, sizes ${(p.sizes ?? []).join("/")}, colours ${((p.colors as { name: string }[] | null) ?? []).map((c) => c.name).join("/")}. ${p.subtitle ?? ""} ${p.fabric ?? ""}`)
    .join("\n");
}

const SYSTEM = (catalog: string) => `You are the shopping assistant for ThePoshakCo, a premium Indian streetwear brand (oversized graphic tees inspired by art and culture). Be warm, concise and stylish. Prices are in INR.
Store facts: free shipping on orders over ₹999, otherwise ₹79; express delivery ₹149; returns within 7 days; payment by Cash on Delivery or UPI. Contact: ThePoshakco@gmail.com, WhatsApp +91 88883 15454.
Only recommend products from this in-stock catalog, and always link them as markdown, e.g. [The Lovers Tee](/product/the-lovers-tee). Never invent products, prices or policies. Recommend at most 4 items at a time. For order-specific issues, direct shoppers to WhatsApp or email.
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
          system: SYSTEM(await catalogText()),
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
