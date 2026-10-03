import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { subscribeNewsletter } from "@/lib/products.functions";

export function Newsletter({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const sub = useServerFn(subscribeNewsletter);
  return (
    <form
      className={`flex border ${dark ? "border-primary-foreground/40" : "border-foreground"}`}
      onSubmit={async (e) => {
        e.preventDefault();
        const r = z.string().trim().email().max(255).safeParse(email);
        if (!r.success) return toast.error("Please enter a valid email.");
        setBusy(true);
        try {
          await sub({ data: { email: r.data } });
          toast.success("You're on the list. Welcome to the crew.");
          setEmail("");
        } catch {
          toast.error("Couldn't subscribe right now. Try again soon.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label htmlFor={dark ? "nl-dark" : "nl"} className="sr-only">Email address</label>
      <input
        id={dark ? "nl-dark" : "nl"}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:opacity-60"
      />
      <button
        disabled={busy}
        aria-label="Subscribe"
        className={`grid w-12 place-items-center ${dark ? "bg-primary-foreground text-forest-deep" : "bg-primary text-primary-foreground"}`}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
