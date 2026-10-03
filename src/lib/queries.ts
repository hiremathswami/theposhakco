import { queryOptions } from "@tanstack/react-query";
import { getProduct, listProducts } from "./products.functions";

export const productsQuery = () =>
  queryOptions({ queryKey: ["products"], queryFn: () => listProducts(), staleTime: 15_000 });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: () => getProduct({ data: { slug } }),
    staleTime: 15_000,
  });
