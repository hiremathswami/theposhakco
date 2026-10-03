<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Product images are stored in the DB as asset keys (resolved by `img()` in src/lib/catalog.ts) or full URLs, so seeded and uploaded images share one field.
- Public catalog reads go through server functions in src/lib/products.functions.ts using a publishable-key client; loaders prime React Query with them.
- Guest cart, wishlist and recently-viewed live in localStorage via StoreProvider (src/lib/store.tsx) until account sync lands.
- Orders are created only by the placeOrder server function (src/lib/orders.functions.ts), which reprices items, applies coupons and decrements stock server-side with the admin client; clients can't insert orders directly.
- The /admin panel uses the browser client and relies on has_role('admin') row rules for every read/write; the role check in the UI is a hint only.
- Uploaded product photos go to the private product-images bucket and are stored as /api/public/product-image/<path>, served by that read-only route, because public buckets are blocked in this workspace.
- Policy texts live in src/content/policies/*.md with {{token}} placeholders filled from the single store_settings row; admin edits are stored as overrides in policy_pages, so defaults stay in code and edits win.
- Checkout consent is enforced server-side in placeOrder (acceptTerms must be true); terms acceptance, policy version and optional marketing consent are stored as separate order columns.
- Router uses react-router-ssr-query so loader-primed queries hydrate on the client without mismatches.
- Motion timings, easing, variants and the Reveal/MotionProvider (site-level reduce-motion toggle + prefers-reduced-motion) live in src/lib/motion.tsx so all animation shares one set of tokens.
- The shopping assistant chat streams from the /api/chat server route, which loads the in-stock catalog into the system prompt so the model only links real products; the single conversation is kept in the shopper's browser.
