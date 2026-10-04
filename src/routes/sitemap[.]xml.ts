import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://theposhakco.lovable.app";
const STATIC_PATHS = [
  "/", "/shop", "/about", "/contact", "/track-order",
  "/privacy-policy", "/terms-and-conditions", "/shipping-policy",
  "/returns-refunds", "/cancellation-policy", "/cookie-policy",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });
        const paths = [...STATIC_PATHS];
        const pageSize = 1000;
        for (let offset = 0; ; ) {
          const { data, error } = await supabase.from("products").select("slug")
            .eq("status", "active").order("id").range(offset, offset + pageSize - 1);
          if (error) return new Response("Sitemap unavailable", { status: 500 });
          if (!data || data.length === 0) break;
          for (const r of data) paths.push(`/product/${encodeURIComponent(r.slug)}`);
          offset += data.length;
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
          .map((p) => `  <url><loc>${BASE_URL}${p}</loc></url>`).join("\n")}\n</urlset>\n`;
        return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
