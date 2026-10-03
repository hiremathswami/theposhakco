import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "./catalog";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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

const COLS =
  "id,slug,title,subtitle,description,fabric,care,category,gender,collections,price,compare_at_price,images,colors,sizes,stock,rating,review_count,is_new,is_bestseller,is_featured,sort_order,created_at";

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select(COLS)
    .eq("status", "active")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({ ...p, rating: Number(p.rating) })) as unknown as Product[];
});

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: p, error } = await publicClient()
      .from("products")
      .select(COLS)
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return p ? ({ ...p, rating: Number(p.rating) } as unknown as Product) : null;
  });

export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().min(0) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: c } = await publicClient()
      .from("coupons")
      .select("code,kind,value,min_order")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();
    if (!c) return { ok: false as const, message: "That code isn't valid." };
    if (data.subtotal < c.min_order)
      return { ok: false as const, message: `Spend ₹${c.min_order} or more to use this code.` };
    const discount = c.kind === "percent" ? Math.round((data.subtotal * c.value) / 100) : c.value;
    return { ok: true as const, code: c.code, discount: Math.min(discount, data.subtotal) };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await publicClient()
      .from("newsletter_subscribers")
      .insert({ email: data.email.toLowerCase() });
    if (error && !error.message.includes("duplicate")) throw new Error("Could not subscribe right now.");
    return { ok: true };
  });
