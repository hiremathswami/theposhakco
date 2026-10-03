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
