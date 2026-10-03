import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const iconBtn = "relative grid h-10 w-10 place-items-center hover:opacity-70 transition";

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        overHero ? "bg-background/70 backdrop-blur-sm" : "bg-background border-b border-border"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:h-[72px] md:px-8">
        <div className="flex items-center gap-2">
          <button className={`${iconBtn} lg:hidden`} aria-label="Open menu" onClick={() => setMenu(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
        </div>
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <Link key={n.label} to={n.to} search={n.search} className="eyebrow !tracking-[0.18em] hover:text-primary">
              {n.label}
            </Link>
          ))}
          <Link to="/about" className="eyebrow !tracking-[0.18em] hover:text-primary">
            About
          </Link>
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
            <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-charcoal">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
      {searchOpen && (
        <form
          className="border-t border-border bg-background"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchOpen(false);
            navigate({ to: "/shop", search: { q: q.trim() || undefined } });
          }}
        >
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 md:px-8">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={80}
              placeholder="Search tees, prints, collections…"
              aria-label="Search products"
              className="flex-1 bg-transparent py-2 text-sm outline-none"
            />
            <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
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
