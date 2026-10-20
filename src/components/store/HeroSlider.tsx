"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BannerDTO } from "@/types";

export function HeroSlider({ banners }: { banners: BannerDTO[] }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  if (!count) return null;

  return (
    <section className="relative overflow-hidden bg-blush-50" aria-roledescription="carousel">
      <div className="grid">
        {banners.map((b, i) => {
          const active = i === index;
          const content = b.showOverlayText ? (
            <div className="relative h-[70vh] min-h-[460px] w-full">
              <picture>
                {b.mobileImage && <source media="(max-width: 640px)" srcSet={b.mobileImage} />}
                <Image src={b.image} alt={b.title || "Banner"} fill priority={i === 0} sizes="100vw" className="object-cover" />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-r from-cream/90 via-cream/50 to-transparent" />
              <div className="container-x relative flex h-full items-center">
                <div className={cn("max-w-lg", active && "animate-fade-up")}>
                  {b.subtitle && <p className="eyebrow mb-4">{b.subtitle}</p>}
                  {b.title && <h1 className="heading-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">{b.title}</h1>}
                  {b.ctaText && <span className="btn-primary mt-8">{b.ctaText}</span>}
                </div>
              </div>
            </div>
          ) : (
            <picture>
              {b.mobileImage && <source media="(max-width: 640px)" srcSet={b.mobileImage} />}
              <Image
                src={b.image}
                alt={b.title || "Banner"}
                width={2056}
                height={765}
                priority={i === 0}
                sizes="100vw"
                className="h-auto w-full"
              />
            </picture>
          );
          return (
            <div
              key={b._id}
              className={cn(
                "col-start-1 row-start-1 transition-opacity duration-1000",
                active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
              )}
              aria-hidden={!active}
            >
              {b.link ? <Link href={b.link}>{content}</Link> : content}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-ivory/80 p-2.5 backdrop-blur transition hover:bg-ivory sm:block"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-ivory/80 p-2.5 backdrop-blur transition hover:bg-ivory sm:block"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button
                key={b._id}
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={cn("h-1.5 rounded-full transition-all", i === index ? "w-8 bg-cocoa" : "w-3 bg-cocoa/30")}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
