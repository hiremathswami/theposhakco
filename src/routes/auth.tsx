import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useStore } from "@/lib/store";
import cOversized from "@/assets/c-oversized.jpg";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string | undefined } => ({
    redirect: typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//") ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — ThePoshakCo" },
      { name: "description", content: "Sign in or create your ThePoshakCo account." },
      { property: "og:title", content: "Sign in — ThePoshakCo" },
      { property: "og:description", content: "Sign in or create your ThePoshakCo account." },
    ],
  }),
  component: AuthPage,
});

const emailS = z.string().trim().email("Enter a valid email").max(255);
const passS = z.string().min(8, "Use at least 8 characters").max(72);

type Mode = "signin" | "signup" | "forgot" | "verify";

function AuthPage() {
  const { user, authReady } = useStore();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const go = () => navigate({ to: redirect ?? "/" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: { email?: string; password?: string; name?: string } = {};
    const em = emailS.safeParse(email);
    if (!em.success) errs.email = em.error.issues[0]?.message ?? "Invalid";
    if (mode !== "forgot") {
      const pw = mode === "signup" ? passS.safeParse(password) : z.string().min(1, "Enter your password").safeParse(password);
      if (!pw.success) errs.password = pw.error.issues[0]?.message ?? "Invalid";
    }
    if (mode === "signup" && (name.trim().length < 2 || name.length > 80)) errs.name = "Enter your name";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: em.data!, password });
        if (error) throw error;
        await qc.invalidateQueries();
        toast.success("Welcome back.");
        go();
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: em.data!, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (data.session) go(); else setMode("verify");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(em.data!, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Check your inbox for a reset link.");
        setMode("signin");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg.includes("Invalid login") ? "Email or password is incorrect." : msg);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) { toast.error("Google sign-in failed. Please try again."); return; }
    if (r.redirected) return;
    go();
  }

  async function signOut() {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const field = "mt-1 w-full border border-input bg-background px-3 py-3 text-sm";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 md:px-16">
        <Link to="/" className="eyebrow text-muted-foreground hover:text-foreground">← Back to store</Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <div className="text-center">
            <img src={logo} alt="" className="mx-auto h-14 w-14" />
            <p className="mt-2 font-display text-2xl">ThePoshakCo</p>
          </div>

          {authReady && user ? (
            <div className="mt-10 text-center">
              <h1 className="font-display text-3xl">You're signed in</h1>
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-8 flex flex-col gap-3">
                <Link to="/shop" className="btn-solid">Continue shopping</Link>
                <button onClick={signOut} className="btn-outline">Sign out</button>
              </div>
            </div>
          ) : mode === "verify" ? (
            <div className="mt-10 text-center">
              <h1 className="font-display text-3xl">Check your email</h1>
              <p className="mt-3 text-sm text-muted-foreground">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
              <button className="mt-8 text-sm underline" onClick={() => setMode("signin")}>Back to sign in</button>
            </div>
          ) : (
            <>
              <div className="mt-8 text-center">
                <h1 className="font-display text-3xl">{mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Welcome back"}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "signup" ? "Join the crew and wear your story." : mode === "forgot" ? "We'll email you a reset link." : "Sign in to continue your style story."}
                </p>
              </div>
              <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
                {mode === "signup" && (
                  <div>
                    <label htmlFor="name" className="text-xs">Full name</label>
                    <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={field} autoComplete="name" aria-invalid={!!errors.name} />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="text-xs">Email</label>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                {mode !== "forgot" && (
                  <div>
                    <div className="flex justify-between">
                      <label htmlFor="password" className="text-xs">Password</label>
                      {mode === "signin" && <button type="button" className="text-xs underline" onClick={() => setMode("forgot")}>Forgot password?</button>}
                    </div>
                    <div className="relative">
                      <input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`${field} pr-10`} autoComplete={mode === "signup" ? "new-password" : "current-password"} aria-invalid={!!errors.password} />
                      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 pt-1">
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                  </div>
                )}
                <button disabled={busy} className="btn-solid w-full">
                  {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
                </button>
              </form>
              {mode !== "forgot" && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
                  <button onClick={google} className="flex w-full items-center justify-center gap-3 border border-input bg-background py-3 text-sm hover:bg-muted">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z"/></svg>
                    Continue with Google
                  </button>
                </>
              )}
              <p className="mt-8 text-center text-sm text-muted-foreground">
                {mode === "signin" ? (<>Don't have an account? <button className="text-foreground underline" onClick={() => setMode("signup")}>Create one</button></>) : (<>Already have an account? <button className="text-foreground underline" onClick={() => setMode("signin")}>Sign in</button></>)}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img src={cOversized} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/50 to-transparent" />
        <p className="absolute bottom-12 left-12 max-w-xs font-display text-5xl italic leading-tight text-ivory">Good clothes.<br />Better people.</p>
      </div>
    </div>
  );
}
