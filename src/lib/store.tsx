import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  savedForLater?: boolean;
};

type StoreCtx = {
  user: User | null;
  session: Session | null;
  authReady: boolean;
  cart: CartLine[];
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addToCart: (l: Omit<CartLine, "key" | "quantity">, qty?: number) => void;
  updateQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  toggleSaved: (key: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  recentlyViewed: string[];
  pushRecent: (slug: string) => void;
};

const Ctx = createContext<StoreCtx | null>(null);

function load<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recentlyViewed, setRecent] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setCart(load("tpc_cart", []));
    setWishlist(load("tpc_wishlist", []));
    setRecent(load("tpc_recent", []));
    setHydrated(true);
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("tpc_cart", JSON.stringify(cart));
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("tpc_wishlist", JSON.stringify(wishlist));
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("tpc_recent", JSON.stringify(recentlyViewed));
  }, [recentlyViewed, hydrated]);

  const addToCart = useCallback<StoreCtx["addToCart"]>((l, qty = 1) => {
    const key = `${l.productId}:${l.size}:${l.color}`;
    setCart((c) => {
      const ex = c.find((x) => x.key === key);
      if (ex) return c.map((x) => (x.key === key ? { ...x, quantity: Math.min(10, x.quantity + qty), savedForLater: false } : x));
      return [...c, { ...l, key, quantity: qty }];
    });
    setCartOpen(true);
  }, []);

  const value = useMemo<StoreCtx>(
    () => ({
      user: session?.user ?? null,
      session,
      authReady,
      cart,
      cartCount: cart.filter((l) => !l.savedForLater).reduce((n, l) => n + l.quantity, 0),
      cartOpen,
      setCartOpen,
      addToCart,
      updateQty: (key, qty) =>
        setCart((c) => c.map((x) => (x.key === key ? { ...x, quantity: Math.max(1, Math.min(10, qty)) } : x))),
      removeLine: (key) => setCart((c) => c.filter((x) => x.key !== key)),
      toggleSaved: (key) => setCart((c) => c.map((x) => (x.key === key ? { ...x, savedForLater: !x.savedForLater } : x))),
      clearCart: () => setCart([]),
      wishlist,
      toggleWishlist: (id) => setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])),
      recentlyViewed,
      pushRecent: (slug) => setRecent((r) => [slug, ...r.filter((s) => s !== slug)].slice(0, 8)),
    }),
    [session, authReady, cart, cartOpen, addToCart, wishlist, recentlyViewed],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
