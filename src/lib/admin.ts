import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "./store";

/** UI hint only — every admin read/write is enforced by database row rules. */
export function useIsAdmin() {
  const { user, authReady } = useStore();
  const q = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });
  return { ready: authReady && (!user || !q.isLoading), isAdmin: !!q.data, user };
}

export const ORDER_STATUSES = ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"] as const;
export const PAYMENT_STATUSES = ["pending", "awaiting_verification", "paid", "refunded", "failed"] as const;
export const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
