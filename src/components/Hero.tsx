import { useState, useEffect } from "react";
import heroImg from "@/assets/hero-flowers.jpg";
import type { BannerRow, ConfigRow } from "@/types/database";

interface Props {
  banners: BannerRow[];
  config: ConfigRow | null;
}

export function Hero({ banners }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setActiveIndex((n) => (n + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <section className="px-0 md:px-10 lg:px-16 md:mt-6 max-w-7xl mx-auto">
        <div className="relative w-full overflow-hidden bg-[#FDFAF6] rounded-none md:rounded-2xl shadow-sm">
          <img
            src={heroImg}
            alt="Arreglo floral de portada"
            className="w-full h-auto block"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="px-0 md:px-10 lg:px-16 md:mt-6 max-w-7xl mx-auto">
      <div className="relative w-full overflow-hidden bg-[#FDFAF6] rounded-none md:rounded-2xl shadow-sm flex items-center">
        {/* Usamos el primer banner como placeholder invisible para darle la altura correcta al contenedor basado en el ratio real de la imagen */}
        <img
          src={banners[0]?.imagen_url || heroImg}
          className="w-full h-auto opacity-0 block pointer-events-none"
          alt="placeholder"
        />
        {banners.map((ban, idx) => {
          const isActive = idx === activeIndex;
          const style = {
            opacity: isActive ? 1 : 0,
            position: "absolute" as const,
            top: 0 as const,
            left: 0 as const,
            width: "100%",
            height: "100%",
            zIndex: isActive ? 10 : 0,
            pointerEvents: (isActive ? "auto" : "none") as React.CSSProperties["pointerEvents"],
          };

          const img = (
            <img
              src={ban.imagen_url}
              alt={ban.titulo ?? "Banner Floreria Miraflores"}
              className="w-full h-full object-cover block transition-opacity duration-700"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = heroImg;
              }}
            />
          );

          if (ban.cta_link) {
            return (
              <a
                key={ban.id}
                href={ban.cta_link}
                className="block transition-opacity duration-700"
                style={style}
                target="_blank"
                rel="noopener noreferrer"
              >
                {img}
              </a>
            );
          }

          return (
            <div key={ban.id} className="transition-opacity duration-700" style={style}>
              {img}
            </div>
          );
        })}
      </div>
    </section>
  );
}
