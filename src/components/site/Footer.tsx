import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import logo from "@/assets/logo.png";
import { CONTACT } from "@/lib/contact";
import { Newsletter } from "./Newsletter";

export function Footer() {
  const col = "flex flex-col gap-2 text-sm text-primary-foreground/70";
  return (
    <footer className="bg-forest-deep text-primary-foreground">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 md:grid-cols-12 md:px-8">
        <div className="md:col-span-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={44} height={44} className="h-11 w-11 invert" loading="lazy" />
            <span className="font-display text-2xl">ThePoshakCo</span>
          </div>
          <p className="mt-3 text-sm text-primary-foreground/70">Built different. Worn better.</p>
          <p className="mt-6 text-sm text-primary-foreground/70">{CONTACT.email}<br />{CONTACT.phoneDisplay}<br />{CONTACT.addressLines.join(", ")}</p>
          <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-primary-foreground/70 underline-offset-4 hover:text-primary-foreground hover:underline">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/></svg>
            WhatsApp us
          </a>
        </div>
        <div className="md:col-span-2">
          <h3 className="eyebrow mb-4 font-sans">Shop</h3>
          <div className={col}>
            <Link to="/shop">All Products</Link>
            <Link to="/shop" search={{ collection: "new-drop" }}>New Drop</Link>
            <Link to="/shop" search={{ gender: "men" }}>Men</Link>
            <Link to="/shop" search={{ gender: "women" }}>Women</Link>
            <Link to="/shop" search={{ collection: "oversized" }}>Oversized</Link>
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="eyebrow mb-4 font-sans">Help</h3>
          <div className={col}>
            <Link to="/contact">Contact & Grievances</Link>
            <Link to="/shipping-policy">Shipping Policy</Link>
            <Link to="/returns-refunds">Returns & Refunds</Link>
            <Link to="/cancellation-policy">Cancellation Policy</Link>
            <Link to="/about">Our Story</Link>
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="eyebrow mb-4 font-sans">Legal</h3>
          <div className={col}>
            <Link to="/terms-and-conditions">Terms & Conditions</Link>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/cookie-policy">Cookie Policy</Link>
          </div>
        </div>
        <div className="md:col-span-3">
          <h3 className="eyebrow mb-2 font-sans">Join the crew</h3>
          <p className="mb-4 text-sm text-primary-foreground/70">Early access to new drops and exclusive offers.</p>
          <Newsletter dark />
          <div className="mt-6 flex gap-4">
            <a href={CONTACT.instagram} aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram className="h-5 w-5" /></a>
            <a href={CONTACT.whatsapp} aria-label="WhatsApp" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/></svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-3 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row md:px-8">
          <span>© {new Date().getFullYear()} ThePoshakCo. All rights reserved.</span>
          <span>UPI · Visa · Mastercard · RuPay · Cash on Delivery</span>
          <span>Art. Culture. Streetwear.</span>
        </div>
      </div>
    </footer>
  );
}
