import { Link } from "@tanstack/react-router";
import { Minus, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/lib/store";
import { img, inr } from "@/lib/catalog";
import { useFreeShippingMin } from "@/lib/use-legal";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const FREE_SHIPPING_MIN = useFreeShippingMin() || 1;
  const left = Math.max(0, FREE_SHIPPING_MIN - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING_MIN) * 100);
  return (
    <div>
      <p className="mb-2 text-xs">
        {left > 0 ? <>You're <strong>{inr(left)}</strong> away from free shipping</> : <>You've unlocked <strong>free shipping</strong></>}
      </p>
      <div className="h-1 w-full bg-muted" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MiniCart() {
  const { cart, cartOpen, setCartOpen, updateQty, removeLine, cartCount } = useStore();
  const lines = cart.filter((l) => !l.savedForLater);
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex w-full flex-col bg-background p-0 sm:max-w-md">
        <div className="border-b border-border p-5">
          <SheetTitle className="font-display text-2xl font-normal">Your Cart ({cartCount})</SheetTitle>
        </div>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="font-display text-2xl">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Find something that tells your story.</p>
            <Link to="/shop" onClick={() => setCartOpen(false)} className="btn-solid">Shop the drop</Link>
          </div>
        ) : (
          <>
            <div className="border-b border-border p-5"><FreeShippingBar subtotal={subtotal} /></div>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-4">
                  <img src={img(l.image)} alt={l.title} className="h-24 w-20 object-cover" loading="lazy" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link to="/product/$slug" params={{ slug: l.slug }} onClick={() => setCartOpen(false)} className="font-display">{l.title}</Link>
                      <button onClick={() => removeLine(l.key)} aria-label={`Remove ${l.title}`}><X className="h-4 w-4" /></button>
                    </div>
                    <p className="text-xs text-muted-foreground">{l.color} / {l.size}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button className="p-2" onClick={() => updateQty(l.key, l.quantity - 1)} aria-label="Decrease quantity"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-sm">{l.quantity}</span>
                        <button className="p-2" onClick={() => updateQty(l.key, l.quantity + 1)} aria-label="Increase quantity"><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="font-display">{inr(l.price * l.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-border p-5">
              <div className="flex justify-between font-display text-lg"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
              <p className="text-xs text-muted-foreground">Shipping and discounts calculated at checkout.</p>
              <Link to="/cart" onClick={() => setCartOpen(false)} className="btn-solid w-full">View cart & checkout</Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
