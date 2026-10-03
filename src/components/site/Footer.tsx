import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Twitter } from "lucide-react";
import logo from "@/assets/logo.png";
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
          <p className="mt-6 text-sm text-primary-foreground/70">hello@theposhakco.in<br />+91 98765 43210<br />Bengaluru, India</p>
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
            <span>Size Guide</span>
            <span>Shipping & Returns</span>
            <span>FAQs</span>
            <span>Contact Us</span>
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="eyebrow mb-4 font-sans">About</h3>
          <div className={col}>
            <Link to="/about">Our Story</Link>
            <span>Privacy Policy</span>
            <span>Terms</span>
          </div>
        </div>
        <div className="md:col-span-3">
          <h3 className="eyebrow mb-2 font-sans">Join the crew</h3>
          <p className="mb-4 text-sm text-primary-foreground/70">Early access to new drops and exclusive offers.</p>
          <Newsletter dark />
          <div className="mt-6 flex gap-4">
            <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noreferrer"><Instagram className="h-5 w-5" /></a>
            <a href="https://x.com" aria-label="X" target="_blank" rel="noreferrer"><Twitter className="h-5 w-5" /></a>
            <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noreferrer"><Youtube className="h-5 w-5" /></a>
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
