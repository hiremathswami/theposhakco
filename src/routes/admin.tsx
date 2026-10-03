import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LayoutDashboard, Package, ShoppingBag, Ticket, ArrowLeft, Users, Scale } from "lucide-react";
import { useIsAdmin } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — ThePoshakCo" },
      { name: "description", content: "Store management for ThePoshakCo." },
      { property: "og:title", content: "Admin — ThePoshakCo" },
      { property: "og:description", content: "Store management for ThePoshakCo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket, exact: false },
  { to: "/admin/legal", label: "Legal & policies", icon: Scale, exact: false },
] as const;

function AdminLayout() {
  const { ready, isAdmin, user } = useIsAdmin();
  if (!ready) return <div className="p-20 text-center text-muted-foreground">Loading…</div>;
  if (!user || !isAdmin)
    return (
      <div className="mx-auto max-w-md px-6 py-32 text-center">
        <h1 className="font-display text-3xl">Admins only</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {user ? "This account doesn't have admin access." : "Sign in with your admin account to continue."}
        </p>
        <Link to="/auth" search={{ redirect: "/admin" }} className="btn-solid mt-8">
          {user ? "Switch account" : "Sign in"}
        </Link>
      </div>
    );
  return (
    <div className="min-h-screen md:grid md:grid-cols-[220px_1fr]">
      <aside className="border-b border-border bg-forest-deep text-ivory md:min-h-screen md:border-b-0">
        <div className="p-5">
          <p className="font-display text-xl">ThePoshakCo</p>
          <p className="eyebrow mt-1 opacity-70">Admin</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.exact }}
              className="flex items-center gap-3 px-3 py-2 text-sm opacity-80 hover:opacity-100 data-[status=active]:bg-ivory/10 data-[status=active]:opacity-100"
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
          <Link to="/" className="mt-2 flex items-center gap-3 px-3 py-2 text-sm opacity-60 hover:opacity-100 md:mt-8">
            <ArrowLeft className="h-4 w-4" /> View store
          </Link>
        </nav>
      </aside>
      <section className="min-w-0 p-5 md:p-10">
        <Outlet />
      </section>
    </div>
  );
}
