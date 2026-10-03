# ThePoshakCo — Full-stack streetwear store

The brief is very large, so it ships in phases. Each phase leaves a working store you can preview. Phase 1 is built first, then each later phase once you approve it.

## Visual direction (from your reference images)
- Warm ivory background, deep forest green buttons and panels, charcoal text, accents in sand, clay and deep red.
- Serif headings (Playfair Display) with a clean sans for body text (DM Sans), uppercase letter-spaced labels.
- Square or barely rounded corners, thin borders, very light shadows, subtle grain texture.
- Large editorial photos. I'll generate original model and product images (the Lovers, Elephant Emblem, Vision, Signature, Roots and Heritage tees, plus collection and banner images) and an original elephant logo.

## Phase 1 — Storefront and core shopping
- **Home:** sticky header that turns solid on scroll, mobile slide-in menu, split hero ("Built Different. Worn Better."), feature strip, New Drop product row, Men / Women / Graphic Tees / Oversized tiles, "Wear Your Story" banner, story section, newsletter signup, full footer.
- **Shop / category pages:** breadcrumbs, product count, sort, sidebar filters (category, size, color, price, availability) that become a drawer on mobile, search, product cards (second photo on hover, swatches, wishlist heart, badges, quick add), "Load more", empty state, loading skeletons.
- **Product page:** gallery with thumbnails and zoom, swipeable on mobile, color and size pickers, size guide popup, stock status, quantity, Add to Cart / Buy Now, tabs for description, fabric, shipping, returns and care, "You may also like", recently viewed, sticky buy bar on mobile.
- **Mini-cart and cart page:** quantity controls, remove, save for later, coupon box, free-shipping progress bar (free over ₹999), totals.
- **Login / signup:** split-screen layout, email + password, Google sign-in, forgot and reset password, show/hide password.
- **About page:** "More Than Clothes" story, vision, values, people.
- About 12 sample products stored in the database.

## Phase 2 — Checkout and accounts
- Checkout: contact, address, delivery method, payment choice (UPI / card / cash on delivery). The online payment provider is left as a ready-to-connect placeholder until you choose one; cash on delivery works end to end.
- Order confirmation page, account dashboard, order history and order details, saved addresses, wishlist.
- Cart and wishlist saved to the account when signed in, and on the device for guests.

## Phase 3 — Admin panel (/admin, admins only)
- Overview: revenue, orders, customers, low stock, charts, recent orders.
- Products: create and edit, upload photos, sizes and colors with stock, SKU, prices, featured / new / draft flags.
- Categories and collections, orders (status, tracking, notes, CSV export), customers, coupons.
- Homepage content: hero, banner, announcement bar, store contact details, maintenance mode.

## Phase 4 — Supporting pages
Search results, contact, FAQ, shipping and returns, privacy, terms, a polished 404 page, and SEO details for every page.

## Technical details
- TanStack Start + Tailwind v4 tokens in styles.css; shadcn components restyled to match.
- Lovable Cloud: tables for products, product_variants, product_images, categories, collections, profiles, carts, cart_items, wishlists, orders, order_items, addresses, coupons, site_settings, newsletter_subscribers; roles in a separate user_roles table with a has_role() check; RLS on every table; product photos stored in a storage bucket.
- Data loaded with React Query and route loaders; forms validated with Zod; orders created and totals calculated on the server.
- Every page gets its own title and description; separate routes rather than anchor links.
