import pLovers from "@/assets/p-lovers.jpg";
import pElephant from "@/assets/p-elephant.jpg";
import pVision from "@/assets/p-vision.jpg";
import pSignature from "@/assets/p-signature.jpg";
import pRoots from "@/assets/p-roots.jpg";
import pHeritage from "@/assets/p-heritage.jpg";
import cMen from "@/assets/c-men.jpg";
import cWomen from "@/assets/c-women.jpg";
import cGraphic from "@/assets/c-graphic.jpg";
import cOversized from "@/assets/c-oversized.jpg";
import story from "@/assets/story.jpg";
import hero from "@/assets/hero.jpg";

const IMAGES: Record<string, string> = {
  "p-lovers": pLovers,
  "p-elephant": pElephant,
  "p-vision": pVision,
  "p-signature": pSignature,
  "p-roots": pRoots,
  "p-heritage": pHeritage,
  "c-men": cMen,
  "c-women": cWomen,
  "c-graphic": cGraphic,
  "c-oversized": cOversized,
  story,
  hero,
};

/** Product images are stored as keys or full URLs (uploaded later). */
export function img(key: string | undefined): string {
  if (!key) return pSignature;
  if (key.startsWith("http")) return key;
  return IMAGES[key] ?? pSignature;
}

export type ProductColor = { name: string; hex: string };

export type Product = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  fabric: string | null;
  care: string | null;
  category: string;
  gender: string;
  collections: string[];
  price: number;
  compare_at_price: number | null;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  stock: number;
  rating: number;
  review_count: number;
  is_new: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
};

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const discountPct = (p: Pick<Product, "price" | "compare_at_price">) =>
  p.compare_at_price && p.compare_at_price > p.price
    ? Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100)
    : 0;

export const FREE_SHIPPING_MIN = 999;
export const SHIPPING_FEE = 79;
