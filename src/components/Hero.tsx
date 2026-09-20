import { useState, useEffect } from "react";
import heroImg from "@/assets/hero-flowers.webp";
import type { BannerRow } from "@/types/database";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  banners: BannerRow[];
}

export function Hero({ banners }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);


  const displayBanners =
    banners.length > 0
      ? banners
      : [
          {
            id: "default",
            imagen_url: heroImg,
            titulo: null,
            subtexto: null,
            cta_texto: null,
            cta_link: null,
            orden: 0,
            activo: true,
            created_at: "",
          } as BannerRow,
        ];

  const total = displayBanners.length;

  useEffect(() => {
    if (total <= 1 || isHovered) return;
    const t = setInterval(() => setActiveIndex((n) => (n + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total, isHovered]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setActiveIndex((n) => (n - 1 + total) % total);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setActiveIndex((n) => (n + 1) % total);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setActiveIndex((n) => (n + 1) % total);
    } else if (isRightSwipe) {
      setActiveIndex((n) => (n - 1 + total) % total);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Proporción exacta de banner largo/panorámico estilo Lima Floral (aprox 3.22:1 / 2560x796 px)
  // en todos los dispositivos (móvil, tablet y PC) para que el banner se vea completo de extremo a extremo sin recortarse.
  const containerClasses =
    "relative w-full overflow-hidden bg-background aspect-[2560/796]";

  return (
    <section className="w-full bg-white">
      {/* Contenedor del banner */}
      <div
        className="w-full relative group overflow-hidden bg-background"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slider track */}
        <div
          className="flex transition-transform duration-700 ease-in-out w-full"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {displayBanners.map((ban) => {
            const img = (
              <img
                src={ban.imagen_url}
                alt={ban.titulo ?? "Banner Florería Miraflores"}
                className="w-full h-full object-cover object-center block select-none"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = heroImg;
                }}
              />
            );

            const content = (
              <>
                {img}
                {(ban.titulo || ban.subtexto) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center px-6 sm:px-12 md:px-16 lg:px-24 text-white">
                    <div className="max-w-2xl animate-fade-in-up">
                      {ban.titulo && (
                        <h2 className="font-display italic text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-tight mb-2 sm:mb-4 drop-shadow-sm">
                          {ban.titulo}
                        </h2>
                      )}
                      {ban.subtexto && (
                        <p className="font-body font-light text-xs sm:text-sm md:text-base opacity-95 mb-4 sm:mb-6 max-w-lg leading-relaxed">
                          {ban.subtexto}
                        </p>
                      )}
                      {ban.cta_texto && (
                        <span className="inline-block px-5 py-2.5 sm:px-7 sm:py-3 bg-white/90 hover:bg-white text-[#2C2420] text-[10px] sm:text-[11px] tracking-widest uppercase font-body font-medium rounded-full shadow-md transition-all duration-300">
                          {ban.cta_texto}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            );

            return (
              <div
                key={ban.id}
                className={`w-full flex-shrink-0 relative select-none ${containerClasses}`}
              >
                {ban.cta_link ? (
                  <a href={ban.cta_link} className="block w-full h-full relative">
                    {content}
                  </a>
                ) : (
                  <div className="w-full h-full relative">{content}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Flechas laterales para Desktop en Hover si hay más de 1 banner */}
        {total > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/60 active:scale-95 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex shadow-sm cursor-pointer border border-white/40"
              aria-label="Anterior banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/60 active:scale-95 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex shadow-sm cursor-pointer border border-white/40"
              aria-label="Siguiente banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Paginación Numérica estilo Lima Floral < 1 2 3 4 > ABAJO DEL BANNER */}
      <div className="flex items-center justify-center gap-3 py-3 sm:py-3.5 select-none text-[#2C2420] bg-white">
        <button
          onClick={handlePrev}
          aria-label="Anterior"
          disabled={total <= 1}
          className="p-1 text-[#8A7A6E] hover:text-[#2C2420] disabled:opacity-40 disabled:hover:text-[#8A7A6E] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3 text-xs font-body">
          {displayBanners.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "font-semibold text-[#2C2420] underline underline-offset-4"
                    : "text-[#8A7A6E] hover:text-[#2C2420]"
                }`}
                aria-label={`Ir al banner ${idx + 1}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          aria-label="Siguiente"
          disabled={total <= 1}
          className="p-1 text-[#8A7A6E] hover:text-[#2C2420] disabled:opacity-40 disabled:hover:text-[#8A7A6E] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}
