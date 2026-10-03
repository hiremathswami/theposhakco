import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

export function Logo({ invert = false }: { invert?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="ThePoshakCo home">
      <img src={logo} alt="" width={40} height={40} className={`h-9 w-9 ${invert ? "invert" : ""}`} />
      <span className="font-display text-xl tracking-tight md:text-2xl">ThePoshakCo</span>
    </Link>
  );
}
