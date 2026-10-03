import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { listProducts } from "./products.functions";

export type StylistPick = { slug: string; reason: string };
export type StylistResult =
  | { ok: true; summary: string; picks: StylistPick[] }
  | { ok: false; message: string };

export const recommendOutfit = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        occasion: z.string().trim().min(3).max(500),
        style: z.string().trim().max(500).default(""),
        gender: z.enum(["any", "men", "women"]).default("any"),
        budget: z.number().int().min(0).max(100000).nullable().default(null),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<StylistResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, message: "The stylist isn't set up yet. Please try again later." };

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");

    const products = await listProducts();
    const catalog = products
      .filter((p) => p.stock > 0)
      .map((p) => ({
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        category: p.category,
        gender: p.gender,
        collections: p.collections,
        price: p.price,
        colors: (p.colors ?? []).map((c) => c.name),
        sizes: p.sizes,
        fabric: p.fabric,
        description: p.description?.slice(0, 240),
      }));
    const known = new Set(catalog.map((c) => c.slug));

    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    const system = `You are the in-house stylist for ThePoshakCo, a premium Indian streetwear brand. Recommend products ONLY from the catalog JSON provided. Pick 3 to 6 items that best fit the shopper's occasion, style, gender preference and budget (per item, INR). Explain each pick in one warm, specific sentence (max 25 words) mentioning colour or fit and how to wear it. Reply with ONLY a JSON object, no markdown: {"summary": "<one or two sentence styling direction>", "picks": [{"slug": "<catalog slug>", "reason": "<sentence>"}]}`;
    const user = `Occasion: ${data.occasion}
Style preferences: ${data.style || "no preference"}
Shopping for: ${data.gender}
Max budget per item: ${data.budget ? `₹${data.budget}` : "no limit"}

Catalog:
${JSON.stringify(catalog)}`;

    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        system,
        prompt: user,
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
      const text = await result.text;
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return { ok: false, message: "Our stylist couldn't put a look together. Try describing it differently." };
      const parsed = JSON.parse(match[0]) as { summary?: unknown; picks?: unknown };
      const picks = (Array.isArray(parsed.picks) ? parsed.picks : [])
        .filter(
          (p): p is StylistPick =>
            !!p && typeof p.slug === "string" && typeof p.reason === "string" && known.has(p.slug),
        )
        .slice(0, 6);
      if (!picks.length) return { ok: false, message: "We couldn't find a close match in the current collection." };
      return { ok: true, summary: typeof parsed.summary === "string" ? parsed.summary : "", picks };
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      console.error("stylist error", status, (e as Error).message);
      if (status === 429) return { ok: false, message: "Our stylist is busy right now. Please try again in a minute." };
      if (status === 402 || status === 403)
        return { ok: false, message: "The stylist is temporarily unavailable. Please try again later." };
      return { ok: false, message: "Something went wrong while styling your look. Please try again." };
    }
  });
