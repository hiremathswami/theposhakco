import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { MotionConfig, motion, type Variants } from "motion/react";

/** Shared timing tokens (seconds). */
export const DUR = { micro: 0.18, panel: 0.32, image: 0.36, reveal: 0.55 } as const;
export const EASE = [0.22, 1, 0.36, 1] as const; // natural ease-out

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.reveal, ease: EASE } },
};
export const lineReveal: Variants = {
  hidden: { y: "105%" },
  show: { y: "0%", transition: { duration: DUR.reveal + 0.1, ease: EASE } },
};
export const stagger = (step = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

type Prefs = { reduce: boolean; setReduce: (v: boolean) => void };
const Ctx = createContext<Prefs>({ reduce: false, setReduce: () => {} });
export const useMotionPrefs = () => useContext(Ctx);

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduce, setReduceState] = useState(false);
  useEffect(() => {
    setReduceState(localStorage.getItem("tpc_reduce_motion") === "1");
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduce);
  }, [reduce]);
  const setReduce = (v: boolean) => {
    localStorage.setItem("tpc_reduce_motion", v ? "1" : "0");
    setReduceState(v);
  };
  return (
    <Ctx.Provider value={{ reduce, setReduce }}>
      <MotionConfig reducedMotion={reduce ? "always" : "user"} transition={{ duration: DUR.panel, ease: EASE }}>
        {children}
      </MotionConfig>
    </Ctx.Provider>
  );
}

/** Reveals once, shortly before entering the viewport. */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string | undefined; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: DUR.reveal, ease: EASE, delay } } }}
    >
      {children}
    </motion.div>
  );
}
