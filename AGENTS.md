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
- AI stylist recommendations run in a server function (src/lib/stylist.functions.ts) that sends the in-stock catalog to the AI Gateway and keeps only slugs that exist, so the model can never surface unknown products.
- Orders are created only by the placeOrder server function (src/lib/orders.functions.ts), which reprices items, applies coupons and decrements stock server-side with the admin client; clients can't insert orders directly.
- The /admin panel uses the browser client and relies on has_role('admin') row rules for every read/write; the role check in the UI is a hint only.
