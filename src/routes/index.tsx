import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Star } from "lucide-react";
import hero from "@/assets/hero-wide.jpg";
import story from "@/assets/story.jpg";
import cMen from "@/assets/c-men.jpg";
import cWomen from "@/assets/c-women.jpg";
import cGraphic from "@/assets/c-graphic.jpg";
import cOversized from "@/assets/c-oversized.jpg";
import { productsQuery } from "@/lib/queries";
import { ProductCard } from "@/components/site/ProductCard";
import { FeatureStrip } from "@/components/site/FeatureStrip";
import { Newsletter } from "@/components/site/Newsletter";
import { motion } from "motion/react";
import { Reveal, fadeUp, lineReveal, stagger } from "@/lib/motion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ThePoshakCo — Built Different. Worn Better." },
      { name: "description", content: "Premium Indian streetwear. Oversized graphic tees inspired by art, culture and people." },
      { property: "og:title", content: "ThePoshakCo — Built Different. Worn Better." },
      { property: "og:description", content: "Premium Indian streetwear. Art. Culture. Streetwear." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: Home,
});

const TILES = [
  { label: "Men", img: cMen, search: { gender: "men" } },
  { label: "Women", img: cWomen, search: { gender: "women" } },
  { label: "Graphic Tees", img: cGraphic, search: { category: "graphic" } },
  { label: "Oversized", img: cOversized, search: { collection: "oversized" } },
] as const;

function VerticalWords({ words }: { words: string[] }) {
  return (
    <div className="hidden flex-col items-start gap-2 md:flex">
      {words.map((w) => (
        <span key={w} className="eyebrow !text-[10px] text-primary-foreground/80">{w}</span>
      ))}
      <span className="mt-3 h-14 w-px bg-primary-foreground/50" />
    </div>
  );
}

function Home() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const newDrop = products.filter((p) => p.is_new).slice(0, 4);
  const best = products.filter((p) => p.is_bestseller);

  return (
    <>
      {/* Hero */}
      <section className="relative -mt-16 overflow-hidden bg-sand md:-mt-[72px]">
        <img src={hero} alt="Model in an oversized black tarot graphic tee sitting beside a green elephant mural" width={1920} height={960} className="animate-hero-zoom absolute inset-0 h-full w-full object-cover object-[72%_center] md:object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-sand/85 via-sand/40 to-transparent md:from-sand/50 md:via-transparent" />
        <motion.div initial="hidden" animate="show" variants={stagger(0.12, 0.15)} className="relative mx-auto flex min-h-[620px] max-w-[1400px] flex-col justify-center px-4 pb-16 pt-32 md:min-h-[min(50vw,780px)] md:px-8">
          <motion.p variants={fadeUp} className="eyebrow mb-5">Indian Streetwear</motion.p>
          <motion.h1 variants={stagger(0.12)} className="display-xl max-w-[12ch]">
            {[["Built", "text-ivory [text-shadow:0_1px_2px_rgb(0_0_0/0.12)]"], ["Different.", "text-ivory [text-shadow:0_1px_2px_rgb(0_0_0/0.12)]"], ["Worn Better.", "text-forest-deep"]].map(([t, c]) => (
              <span key={t} className="block overflow-hidden pb-[0.06em]">
                <motion.span variants={lineReveal} className={`block ${c}`}>{t}</motion.span>
              </span>
            ))}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-sm font-display text-lg leading-snug">Art. Culture. Streetwear.<br />For a generation that wears meaning.</motion.p>
          <motion.div variants={fadeUp} className="mt-8">
            <Link to="/shop" search={{ collection: "new-drop" }} className="btn-solid">Shop the drop <ArrowRight className="h-4 w-4" /></Link>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[cMen, cWomen, cGraphic, cOversized].map((s, i) => (
                <img key={i} src={s} alt="" className="h-9 w-9 rounded-full border-2 border-ivory object-cover" loading="lazy" />
              ))}
            </div>
            <div className="text-sm">
              <p>Trusted by 10K+ customers</p>
              <p className="flex items-center gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                <span className="ml-1 text-foreground">4.8/5</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
        <div className="absolute bottom-10 right-6 md:right-8">
          <VerticalWords words={["Same", "clothes", "different", "people", "bigger", "stories."]} />
        </div>
      </section>

      <FeatureStrip />

      {/* New drop */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
        <Reveal><p className="eyebrow mb-3">Latest collection</p>
        <div className="mb-10 flex items-end gap-6">
          <h2 className="display-lg shrink-0">New Drop</h2>
          <span className="mb-4 hidden h-px flex-1 bg-foreground md:block" />
          <Link to="/shop" search={{ collection: "new-drop" }} className="mb-2 flex shrink-0 items-center gap-2 text-sm hover:underline">View all <ArrowRight className="h-4 w-4" /></Link>
        </div></Reveal>
        <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
          {newDrop.map((p, i) => <Reveal key={p.id} delay={i * 0.06}><ProductCard p={p} showAdd /></Reveal>)}
        </div>
      </section>

      {/* Category tiles */}
      <section aria-label="Shop by category" className="grid grid-cols-2 gap-2 px-2 md:grid-cols-4">
        {TILES.map((t) => (
          <Link key={t.label} to="/shop" search={t.search} className="group relative aspect-[4/5] overflow-hidden md:aspect-[16/11]">
            <img src={t.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/10 to-transparent" />
            <div className="absolute bottom-5 left-5 text-ivory">
              <h3 className="font-display text-2xl uppercase md:text-3xl">{t.label}</h3>
              <span className="eyebrow mt-1 flex items-center gap-2 !text-[10px]">Explore <ArrowRight className="h-3 w-3" /></span>
            </div>
          </Link>
        ))}
      </section>

      {/* Wear your story */}
      <section className="relative mt-2 overflow-hidden bg-forest-deep text-primary-foreground">
        <img src={story} alt="Model in a white elephant emblem tee" loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[65%_center] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep via-forest-deep/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[520px] max-w-[1400px] items-center justify-between px-4 py-20 md:px-8">
          <Reveal className="max-w-lg">
            <p className="eyebrow mb-4">More than clothes</p>
            <h2 className="display-xl !text-[clamp(2.5rem,5vw,4.5rem)]">Wear<br />your story.</h2>
            <p className="mt-6 font-display text-lg">Inspired by art. Rooted in culture.<br />Made for the now.</p>
            <Link to="/shop" className="btn-outline mt-8 !border-ivory bg-ivory !text-charcoal hover:!bg-transparent hover:!text-ivory">Shop now <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
          <VerticalWords words={["People", "places", "ideas", "emotions", "on a tee"]} />
        </div>
      </section>

      {/* Bestsellers carousel */}
      {best.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24">
          <Reveal><p className="eyebrow mb-3">Most loved</p>
          <h2 className="display-lg mb-10">Bestsellers</h2></Reveal>
          <Carousel opts={{ align: "start" }}>
            <CarouselContent className="-ml-3 md:-ml-6">
              {best.map((p) => (
                <CarouselItem key={p.id} className="basis-1/2 pl-3 md:basis-1/3 md:pl-6 lg:basis-1/4">
                  <ProductCard p={p} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="mt-6 flex justify-end gap-2">
              <CarouselPrevious className="static translate-y-0 rounded-none" />
              <CarouselNext className="static translate-y-0 rounded-none" />
            </div>
          </Carousel>
        </section>
      )}

      {/* Culture */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <img src={cOversized} alt="Heritage back print tee" loading="lazy" className="aspect-[4/5] w-full object-cover" />
          <Reveal className="max-w-md">
            <p className="eyebrow mb-4">Our culture</p>
            <h2 className="display-lg">Art you<br />can wear.</h2>
            <p className="mt-6 text-muted-foreground">Every ThePoshakCo piece starts as an artwork — tarot cards, temple engravings, royal elephants, city walls. We print them on heavyweight cotton so the stories travel with you.</p>
            <Link to="/about" className="btn-outline mt-8">Our story <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-2xl px-4 py-16 text-center md:py-24">
        <Reveal><p className="eyebrow mb-3">Join the crew</p>
        <h2 className="display-lg">First to the drop.</h2>
        <p className="mb-8 mt-4 text-muted-foreground">Early access to new releases and members-only offers. No spam.</p>
        <div className="mx-auto max-w-md"><Newsletter /></div></Reveal>
      </section>
    </>
  );
}
