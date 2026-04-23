"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Vista >= lg (1024px): panorámicas / paisaje.
 * Fotos hero-unsplash-*: Unsplash (unsplash.com/license).
 */
const HERO_BACKGROUNDS_DESKTOP = [
  "/books-bookstore-book-reading-159711.webp",
  "/hero-unsplash-biblioteca.webp",
  "/educacion-chile.webp",
  "/engaging-lectures.webp",
  "/universidad-autonoma-facultad-educacion.webp",
  "/64481f3d579fd.webp",
  "/How-to-Improve-Student-Engagement-in-the-Classroom-01.webp",
  "/iStock-1322369839-1080x675.webp",
  "/iStock-1340725917-1080x675.webp",
  "/hero-unsplash-aula.webp",
  "/hero-unsplash-apuntes.webp",
  "/hero-unsplash-campus.webp",
  "/hero-unsplash-grupo.webp",
  "/hero-unsplash-laptop.webp",
] as const;

/**
 * Móvil y tablet (< lg): recortes verticales 900×1400 descargados para mejor encuadre en pantallas estrechas.
 */
const HERO_BACKGROUNDS_COMPACT = [
  "/hero-mobile-1.webp",
  "/hero-mobile-2.webp",
  "/hero-mobile-3.webp",
  "/hero-mobile-4.webp",
  "/hero-mobile-5.webp",
  "/hero-mobile-6.webp",
  "/hero-mobile-7.webp",
  "/hero-mobile-8.webp",
  "/hero-mobile-9.webp",
  "/hero-mobile-10.webp",
] as const;

const COMPACT_MEDIA_QUERY = "(max-width: 1023px)";

function subscribeCompact(listener: () => void) {
  const mq = window.matchMedia(COMPACT_MEDIA_QUERY);
  mq.addEventListener("change", listener);
  return () => mq.removeEventListener("change", listener);
}

function getCompactSnapshot() {
  return window.matchMedia(COMPACT_MEDIA_QUERY).matches;
}

/** En SSR asumimos escritorio; al hidratar se ajusta al ancho real. */
function getServerCompactSnapshot() {
  return false;
}

function useHeroCompactLayout() {
  return useSyncExternalStore(subscribeCompact, getCompactSnapshot, getServerCompactSnapshot);
}

export default function BackgroundCarousel() {
  const compact = useHeroCompactLayout();
  const images = compact ? HERO_BACKGROUNDS_COMPACT : HERO_BACKGROUNDS_DESKTOP;

  const [index, setIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const fadeCleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIndex(0);
    setPreviousIndex(null);
    setShowPrevious(false);
  }, [compact]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % images.length;
        setPreviousIndex(prev);
        setShowPrevious(true);
        window.requestAnimationFrame(() => setShowPrevious(false));
        return next;
      });

      if (fadeCleanupRef.current) {
        clearTimeout(fadeCleanupRef.current);
      }
      fadeCleanupRef.current = setTimeout(() => {
        setPreviousIndex(null);
      }, 1050);
    }, 5200);

    return () => {
      clearInterval(interval);
      if (fadeCleanupRef.current) {
        clearTimeout(fadeCleanupRef.current);
      }
    };
  }, [images.length, compact]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {previousIndex !== null && previousIndex !== index && (
        <Image
          key={`prev-${images[previousIndex]}`}
          src={images[previousIndex]}
          alt="Fondo educativo"
          fill
          priority={false}
          sizes="100vw"
          className={
            "object-cover object-center transition-opacity duration-1000 " +
            (showPrevious ? "opacity-100" : "opacity-0")
          }
        />
      )}
      <Image
        key={images[index]}
        src={images[index]}
        alt="Fondo educativo"
        fill
        priority={index === 0}
        sizes="100vw"
        className="object-cover object-center"
      />
    </div>
  );
}
