import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
  provider: string;
  is_admin: boolean;
  orders: number;
  spent: number;
};

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUser[]> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(error.message);
    const [{ data: profiles }, { data: roles }, { data: orders }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,full_name,phone"),
      supabaseAdmin.from("user_roles").select("user_id,role").eq("role", "admin"),
      supabaseAdmin.from("orders").select("user_id,total,status"),
    ]);
    const prof = new Map((profiles ?? []).map((p) => [p.id, p]));
    const admins = new Set((roles ?? []).map((r) => r.user_id));
    const stats = new Map<string, { n: number; s: number }>();
    for (const o of orders ?? []) {
      if (!o.user_id) continue;
      const cur = stats.get(o.user_id) ?? { n: 0, s: 0 };
      cur.n++;
      if (o.status !== "cancelled") cur.s += o.total;
      stats.set(o.user_id, cur);
    }
    return data.users
      .map((u) => {
        const p = prof.get(u.id);
        const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
        return {
          id: u.id,
          email: u.email ?? "",
          full_name: p?.full_name ?? (typeof meta["full_name"] === "string" ? (meta["full_name"] as string) : null),
          phone: p?.phone ?? null,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at ?? null,
          confirmed: !!u.email_confirmed_at,
          provider: String(u.app_metadata?.["provider"] ?? "email"),
          is_admin: admins.has(u.id),
          orders: stats.get(u.id)?.n ?? 0,
          spent: stats.get(u.id)?.s ?? 0,
        };
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  });
