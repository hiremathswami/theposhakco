import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listUsers } from "@/lib/admin-users.functions";
import { inr } from "@/lib/catalog";

export const Route = createFileRoute("/admin/users")({ component: Users });

const date = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

function Users() {
  const fetchUsers = useServerFn(listUsers);
  const [q, setQ] = useState("");
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin-users"], queryFn: () => fetchUsers() });
  const rows = data.filter((u) => `${u.email} ${u.full_name ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">{data.length} signed-up accounts</p>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone" aria-label="Search users"
          className="w-full max-w-xs border border-border bg-background px-3 py-2 text-sm" />
      </div>
      {isLoading && <p className="mt-6 text-muted-foreground">Loading…</p>}
      {error && <p className="mt-6 text-blood">Could not load users.</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2">Customer</th><th>Phone</th><th>Joined</th><th>Last sign in</th><th>Orders</th><th>Spent</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border">
                <td className="py-3">
                  <p className="font-medium">{u.full_name || "—"} {u.is_admin && <span className="ml-1 bg-forest px-1.5 py-0.5 text-[10px] uppercase text-ivory">Admin</span>}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td>{u.phone || "—"}</td>
                <td>{date(u.created_at)}</td>
                <td>{date(u.last_sign_in_at)}</td>
                <td>{u.orders}</td>
                <td>{inr(u.spent)}</td>
                <td className="text-xs">
                  <span className={u.confirmed ? "text-forest" : "text-blood"}>{u.confirmed ? "Verified" : "Unverified"}</span>
                  <span className="text-muted-foreground"> · {u.provider}</span>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
