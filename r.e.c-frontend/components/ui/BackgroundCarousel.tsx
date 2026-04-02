"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export default function BackgroundCarousel() {
  const images = useMemo(
    () => [
      "/books-bookstore-book-reading-159711.jpeg",
      "/Educacion-Grado.jpg",
      "/universidad-autonoma-facultad-educacion.jpg",
      "/beneficios-educacion-superior-titulo-universitario.jpg",
      "/educacion-formal-e1536242919719.jpg",
      "/educacion-chile.webp",
      "/64481f3d579fd.jpeg",
    ],
    [],
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5200);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt="Fondo educativo"
          fill
          priority={i === 0}
          sizes="100vw"
          className={
            "object-cover transition-opacity duration-1000 " +
            (i === index ? "opacity-100" : "opacity-0")
          }
        />
      ))}
    </div>
  );
}
