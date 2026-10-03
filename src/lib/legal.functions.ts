import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type LegalData = {
  settings: Database["public"]["Tables"]["store_settings"]["Row"] | null;
  overrides: Record<string, string>;
};

export const getLegal = createServerFn({ method: "GET" }).handler(async (): Promise<LegalData> => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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
  const [{ data: settings }, { data: pages }] = await Promise.all([
    sb.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("policy_pages").select("slug,body"),
  ]);
  return { settings: settings ?? null, overrides: Object.fromEntries((pages ?? []).map((p) => [p.slug, p.body])) };
});
