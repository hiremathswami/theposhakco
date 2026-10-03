import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Refreshes product lists and pages on every open device when products change. */
export function LiveProducts() {
  const qc = useQueryClient();
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        void qc.invalidateQueries({ queryKey: ["products"] });
        void qc.invalidateQueries({ queryKey: ["product"] });
      }, 300);
    };
    const ch = supabase
      .channel("products-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, refresh)
      .subscribe();
    return () => {
      clearTimeout(t);
      void supabase.removeChannel(ch);
    };
  }, [qc]);
  return null;
}
