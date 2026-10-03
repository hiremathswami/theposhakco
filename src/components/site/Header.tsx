import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/queries";
import { img, inr } from "@/lib/catalog";
import { DUR, EASE } from "@/lib/motion";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";

export const NAV = [
  { label: "Shop", to: "/shop", search: {} },
  { label: "New Drop", to: "/shop", search: { collection: "new-drop" } },
  { label: "Men", to: "/shop", search: { gender: "men" } },
  { label: "Women", to: "/shop", search: { gender: "women" } },
  { label: "Oversized", to: "/shop", search: { collection: "oversized" } },
  { label: "AI Stylist", to: "/stylist", search: {} },
] as const;

export function Header() {
  const { cartCount, setCartOpen, user, wishlist } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const overHero = pathname === "/" && !scrolled;
  const [hovered, setHovered] = useState<string | null>(null);
  const [pop, setPop] = useState(false);
  const prevCount = useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCount.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 340);
      prevCount.current = cartCount;
      return () => clearTimeout(t);
    }
    prevCount.current = cartCount;
    return undefined;
  }, [cartCount]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const iconBtn = "relative grid h-10 w-10 place-items-center hover:opacity-70 transition";

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 ease-out ${
        overHero ? "border-transparent bg-transparent" : "border-border bg-background/90 shadow-[0_6px_24px_-18px_rgb(0_0_0/0.35)] backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:h-[72px] md:px-8">
        <div className="flex items-center gap-2">
          <button className={`${iconBtn} lg:hidden`} aria-label="Open menu" onClick={() => setMenu(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </div>
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex" onMouseLeave={() => setHovered(null)}>
          {[...NAV, { label: "About", to: "/about", search: {} } as const].map((n) => (
            <Link
              key={n.label}
              to={n.to}
              search={n.search}
              onMouseEnter={() => setHovered(n.label)}
              onFocus={() => setHovered(n.label)}
              className="eyebrow relative py-2 !tracking-[0.18em] transition-colors duration-200 hover:text-primary"
            >
              {n.label}
              {hovered === n.label && (
                <motion.span layoutId="nav-underline" className="absolute inset-x-0 -bottom-0.5 h-px bg-primary" transition={{ duration: DUR.micro + 0.04, ease: EASE }} />
              )}
            </Link>
          ))}
        </nav>
        <div className="flex items-center">
          <button className={iconBtn} aria-label="Search" onClick={() => setSearchOpen((v) => !v)}>
            <Search className="h-5 w-5" />
          </button>
          <Link to="/auth" className={`${iconBtn} hidden sm:grid`} aria-label={user ? "Account" : "Sign in"}>
            <User className="h-5 w-5" />
            {user && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />}
          </Link>
          <Link to="/shop" search={{ wishlist: true }} className={`${iconBtn} hidden sm:grid`} aria-label={`Wishlist, ${wishlist.length} items`}>
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blood" />}
          </Link>
          <button className={iconBtn} aria-label={`Cart, ${cartCount} items`} onClick={() => setCartOpen(true)}>
            <ShoppingBag className="h-5 w-5" />
            <span className={`${pop ? "animate-pop" : ""} absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-charcoal`}>
              {cartCount}
            </span>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {searchOpen && (
          <SearchOverlay
            q={q}
            setQ={setQ}
            onClose={() => setSearchOpen(false)}
            onSubmit={(term) => {
              setSearchOpen(false);
              if (term) {
                const recent = [term, ...JSON.parse(localStorage.getItem("tpc_recent_q") ?? "[]").filter((r: string) => r !== term)].slice(0, 5);
                localStorage.setItem("tpc_recent_q", JSON.stringify(recent));
              }
              navigate({ to: "/shop", search: { q: term || undefined } });
            }}
          />
        )}
      </AnimatePresence>
      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-[85vw] max-w-sm bg-background p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="border-b border-border p-5">
            <Logo />
          </div>
          <nav className="flex flex-col p-5" aria-label="Mobile">
            {NAV.map((n) => (
              <Link key={n.label} to={n.to} search={n.search} onClick={() => setMenu(false)} className="border-b border-border py-4 font-display text-2xl">
                {n.label}
              </Link>
            ))}
            <Link to="/about" onClick={() => setMenu(false)} className="border-b border-border py-4 font-display text-2xl">
              About
            </Link>
            <Link to="/auth" onClick={() => setMenu(false)} className="py-4 eyebrow">
              {user ? "My account" : "Sign in / Create account"}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

function SearchOverlay({ q, setQ, onClose, onSubmit }: { q: string; setQ: (v: string) => void; onClose: () => void; onSubmit: (term: string) => void }) {
  const { data: products = [] } = useQuery(productsQuery());
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem("tpc_recent_q") ?? "[]"));
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);
  const term = q.trim().toLowerCase();
  const matches = (term ? products.filter((p) => `${p.title} ${p.subtitle ?? ""}`.toLowerCase().includes(term)) : products.filter((p) => p.is_new)).slice(0, 4);
  return (
    <>
      <motion.div className="fixed inset-0 top-16 z-30 bg-charcoal/30 md:top-[72px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-label="Search"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: DUR.panel, ease: EASE }}
        className="absolute inset-x-0 top-full z-40 border-t border-border bg-background shadow-lg"
      >
        <form className="mx-auto max-w-[1400px] px-4 py-5 md:px-8" onSubmit={(e) => { e.preventDefault(); onSubmit(q.trim()); }}>
          <div className="flex items-center gap-3 border-b border-foreground pb-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder="Search tees, prints, collections…" aria-label="Search products" className="flex-1 bg-transparent py-2 font-display text-xl outline-none" />
            <button type="button" aria-label="Close search" onClick={onClose}><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-[200px_1fr]">
            <div>
              <p className="eyebrow mb-3 !text-[10px]">Recent searches</p>
              {recent.length ? (
                <ul className="flex flex-wrap gap-2 md:flex-col md:gap-1.5">
                  {recent.map((r) => <li key={r}><button type="button" onClick={() => onSubmit(r)} className="text-sm hover:text-primary">{r}</button></li>)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Nothing yet</p>}
            </div>
            <div>
              <p className="eyebrow mb-3 !text-[10px]">{term ? "Suggestions" : "New in"}</p>
              {matches.length ? (
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {matches.map((p, i) => (
                    <motion.li key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: DUR.micro + 0.1 }}>
                      <Link to="/product/$slug" params={{ slug: p.slug }} onClick={onClose} className="group block">
                        <div className="aspect-[5/6] overflow-hidden bg-card"><img src={img(p.images[0])} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                        <p className="mt-2 text-sm">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{inr(p.price)}</p>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">No matches for "{q}".</p>}
            </div>
          </div>
        </form>
      </motion.div>
    </>
  );
}
