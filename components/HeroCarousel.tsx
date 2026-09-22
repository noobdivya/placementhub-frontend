"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import type { HeroSlide } from "@/lib/data";

export default function HeroCarousel({ heroSlides }: { heroSlides: HeroSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = heroSlides.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <section
      className="relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }}>
        {heroSlides.map((s, idx) => (
          <div
            key={s.title}
            className={`relative min-w-full bg-gradient-to-br ${s.gradient} text-slate-900 dark:text-white`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${idx + 1} of ${n}`}
            aria-hidden={idx !== i}
          >
            <div className="absolute inset-0 opacity-70 dark:opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_35%),radial-gradient(circle_at_85%_75%,white_0,transparent_30%)]" />
            <div className="relative mx-auto flex min-h-[22rem] max-w-7xl flex-col justify-center px-6 py-16 sm:min-h-[26rem] sm:px-10 lg:px-16">
              <p className="mb-3 inline-flex w-fit items-center rounded-full bg-slate-900/10 px-3 dark:bg-white/15 py-1 text-xs font-semibold uppercase tracking-wider">{s.eyebrow}</p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-5xl">{s.title}</h2>
              <p className="mt-4 max-w-xl text-base text-slate-700 dark:text-white/85 sm:text-lg">{s.text}</p>
              <div className="mt-7">
                <Link href={s.href} tabIndex={idx === i ? 0 : -1} className="btn bg-slate-900 !px-5 !py-2.5 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                  {s.cta} <Icon name={s.cta.startsWith("Download") ? "download" : "arrow"} className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/70 p-2 text-slate-800 hover:bg-white dark:bg-black/25 dark:text-white dark:hover:bg-black/40 sm:block" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous slide">
        <Icon name="arrow" className="size-5 rotate-180" />
      </button>
      <button className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/70 p-2 text-slate-800 hover:bg-white dark:bg-black/25 dark:text-white dark:hover:bg-black/40 sm:block" onClick={() => setI((i + 1) % n)} aria-label="Next slide">
        <Icon name="arrow" className="size-5" />
      </button>

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {heroSlides.map((s, idx) => (
          <button
            key={s.title}
            onClick={() => setI(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            aria-current={idx === i}
            className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-slate-800 dark:bg-white" : "w-2 bg-slate-800/30 hover:bg-slate-800/60 dark:bg-white/50 dark:hover:bg-white/80"}`}
          />
        ))}
      </div>
    </section>
  );
}
