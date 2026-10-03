import { queryOptions, useQuery } from "@tanstack/react-query";
import { getLegal } from "./legal.functions";
import { DEFAULT_SETTINGS, type StoreSettings } from "./legal";

export const legalQuery = queryOptions({ queryKey: ["legal"], queryFn: () => getLegal(), staleTime: 60_000 });

export function useLegal() {
  const q = useQuery(legalQuery);
  const settings: StoreSettings = { ...DEFAULT_SETTINGS, ...(q.data?.settings ?? {}) };
  return { settings, overrides: q.data?.overrides ?? {}, isLoading: q.isLoading };
}

export const useFreeShippingMin = () => useLegal().settings.free_shipping_threshold;
