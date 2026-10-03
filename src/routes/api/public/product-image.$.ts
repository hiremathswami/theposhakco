import { createFileRoute } from "@tanstack/react-router";

// Serves uploaded product photos from private storage (read-only, images only).
export const Route = createFileRoute("/api/public/product-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat ?? "";
        if (!/^[a-zA-Z0-9/_.-]{1,200}$/.test(path) || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("product-images").download(path);
        if (error || !data) return new Response("Not found", { status: 404 });
        const type = data.type && data.type.startsWith("image/") ? data.type : "image/jpeg";
        return new Response(data, {
          headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" },
        });
      },
    },
  },
});
