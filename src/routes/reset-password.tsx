import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — ThePoshakCo" },
      { name: "description", content: "Choose a new password for your ThePoshakCo account." },
      { property: "og:title", content: "Set a new password — ThePoshakCo" },
      { property: "og:description", content: "Choose a new password for your account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [pw, setPw] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setReady(true);
    const { data } = supabase.auth.onAuthStateChange((e) => { if (e === "PASSWORD_RECOVERY") setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl">Set a new password</h1>
        {!ready ? (
          <p className="mt-4 text-sm text-muted-foreground">Open this page from the reset link in your email. <Link to="/auth" className="underline">Back to sign in</Link></p>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (pw.length < 8) return toast.error("Use at least 8 characters.");
              setBusy(true);
              const { error } = await supabase.auth.updateUser({ password: pw });
              setBusy(false);
              if (error) return toast.error(error.message);
              toast.success("Password updated.");
              navigate({ to: "/" });
            }}
          >
            <label htmlFor="pw" className="text-xs">New password</label>
            <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" className="w-full border border-input bg-background px-3 py-3 text-sm" />
            <button disabled={busy} className="btn-solid w-full">Update password</button>
          </form>
        )}
      </div>
    </div>
  );
}
