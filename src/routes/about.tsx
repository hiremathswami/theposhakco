import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye, Gem, Users } from "lucide-react";
import hero from "@/assets/hero.jpg";
import story from "@/assets/story.jpg";
import cMen from "@/assets/c-men.jpg";
import cWomen from "@/assets/c-women.jpg";
import cGraphic from "@/assets/c-graphic.jpg";
import { CONTACT } from "@/lib/contact";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — ThePoshakCo" },
      { name: "description", content: "ThePoshakCo is an Indian streetwear brand inspired by art, culture and the people who make the streets alive." },
      { property: "og:title", content: "More Than Clothes — ThePoshakCo" },
      { property: "og:description", content: "An Indian streetwear brand inspired by art, culture and people." },
    ],
  }),
  component: About,
});

const VALUES = [
  { icon: Eye, t: "Our vision", d: "To build a global Indian streetwear brand rooted in culture and creativity." },
  { icon: Gem, t: "Our values", d: "Authenticity, quality and community — in every stitch and every print." },
  { icon: Users, t: "Our people", d: "For the dreamers, the creators, and the ones who wear their story." },
];

function About() {
  return (
    <>
      <section className="grain relative overflow-hidden bg-sand">
        <div className="mx-auto grid max-w-[1400px] items-center md:grid-cols-2">
          <div className="relative z-10 px-4 py-20 md:px-8 md:py-28">
            <p className="eyebrow mb-4">Our story</p>
            <h1 className="display-xl normal-case">More Than<br />Clothes.</h1>
            <p className="mt-6 max-w-md text-foreground/80">ThePoshakCo is a clothing brand inspired by art, culture and the people who make the streets alive. We create pieces that tell stories — of places, emotions and ideas — for a generation that wears meaning.</p>
            <Link to="/shop" className="btn-solid mt-8">Our collections <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <img src={hero} alt="Model in a ThePoshakCo graphic tee" className="h-full max-h-[640px] w-full object-cover" width={1600} height={1104} />
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 md:grid-cols-3 md:px-8">
          {VALUES.map(({ icon: I, t, d }) => (
            <div key={t} className="text-center">
              <I className="mx-auto h-6 w-6" strokeWidth={1.25} />
              <h2 className="eyebrow mt-4 font-sans">{t}</h2>
              <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] items-center gap-12 px-4 py-20 md:grid-cols-2 md:px-8">
        <img src={story} alt="Model in an elephant emblem tee" loading="lazy" className="aspect-[4/3] w-full object-cover" />
        <div className="max-w-md">
          <p className="eyebrow mb-4">Where it starts</p>
          <h2 className="display-lg">Art first.<br />Then cotton.</h2>
          <p className="mt-6 text-muted-foreground">Every design begins as an artwork — drawn from temple carvings, tarot decks, folk motifs and the walls of our cities. We work with independent illustrators across India and print on heavyweight, responsibly-sourced cotton built to last years, not seasons.</p>
        </div>
      </section>

      <section className="bg-forest-deep text-primary-foreground">
        <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8">
          <p className="eyebrow mb-4">The community</p>
          <h2 className="display-lg max-w-2xl">Same clothes. Different people. Bigger stories.</h2>
          <div className="mt-12 grid grid-cols-3 gap-2 md:gap-4">
            {[cMen, cWomen, cGraphic].map((s, i) => <img key={i} src={s} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />)}
          </div>
          <Link to="/shop" className="btn-outline mt-12 !border-ivory !text-ivory hover:!bg-ivory hover:!text-charcoal">Browse the collection <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-20 md:px-8">
        <p className="eyebrow mb-4">Reach us</p>
        <h2 className="display-lg max-w-xl">Talk to us<br />anytime.</h2>
        <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          <a href={`mailto:${CONTACT.email}`} className="group bg-card p-6 hover:bg-sand">
            <p className="eyebrow">Email</p>
            <p className="mt-2 break-all text-sm font-medium">{CONTACT.email}</p>
          </a>
          <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className="group bg-card p-6 hover:bg-sand">
            <p className="eyebrow">WhatsApp</p>
            <p className="mt-2 text-sm font-medium">{CONTACT.phoneDisplay}</p>
          </a>
          <a href={CONTACT.instagram} target="_blank" rel="noreferrer" className="group bg-card p-6 hover:bg-sand">
            <p className="eyebrow">Instagram</p>
            <p className="mt-2 break-all text-sm font-medium">@theposhak.co</p>
          </a>
          <div className="bg-card p-6">
            <p className="eyebrow">Studio</p>
            <p className="mt-2 text-sm font-medium">{CONTACT.addressLines.map((l: string) => <span key={l} className="block">{l}</span>)}</p>
          </div>
        </div>
      </section>
    </>
  );
}
