import { useState, useEffect } from "react";
import heroImg from "@/assets/hero-flowers.jpg";
import type { BannerRow, ConfigRow } from "@/types/database";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  banners: BannerRow[];
  config: ConfigRow | null;
}

export function Hero({ banners }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const t = setInterval(() => setActiveIndex((n) => (n + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((n) => (n - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveIndex((n) => (n + 1) % banners.length);
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
      setActiveIndex((n) => (n + 1) % banners.length);
    } else if (isRightSwipe) {
      setActiveIndex((n) => (n - 1 + banners.length) % banners.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Altura responsiva profesional: 260px en móvil, 350px en tablet, 450px en PC estándar y 480px en pantallas grandes
  const containerClasses =
    "relative w-full overflow-hidden bg-[#FDFAF6] h-[260px] sm:h-[350px] md:h-[450px] lg:h-[480px] xl:h-[500px]";

  if (banners.length === 0) {
    return (
      <section className="w-full">
        <div className={containerClasses}>
          <img
            src={heroImg}
            alt="Arreglo floral de portada"
            className="w-full h-full object-cover object-center block"
          />
        </div>
      </section>
    );
  }

  // Caso de banner único: se muestra con la altura responsiva fija ideal y object-cover
  if (banners.length === 1) {
    const ban = banners[0];
    const img = (
      <img
        src={ban.imagen_url}
        alt={ban.titulo ?? "Banner Florería Miraflores"}
        className="w-full h-full object-cover object-center block select-none pointer-events-none"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = heroImg;
        }}
      />
    );

    return (
      <section className="w-full">
        <div className={containerClasses}>
          {ban.cta_link ? (
            <a
              href={ban.cta_link}
              className="block w-full h-full pointer-events-auto"
              target="_blank"
              rel="noopener noreferrer"
            >
              {img}
            </a>
          ) : (
            img
          )}
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full relative group overflow-hidden bg-[#FDFAF6]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider track (desplazamiento horizontal fluido) */}
      <div
        className="flex transition-transform duration-700 ease-in-out w-full"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {banners.map((ban) => {
          const img = (
            <img
              src={ban.imagen_url}
              alt={ban.titulo ?? "Banner Florería Miraflores"}
              className="w-full h-full object-cover object-center block select-none pointer-events-none"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = heroImg;
              }}
            />
          );

          return (
            <div
              key={ban.id}
              className={`w-full flex-shrink-0 relative select-none ${containerClasses}`}
            >
              {ban.cta_link ? (
                <a
                  href={ban.cta_link}
                  className="block w-full h-full pointer-events-auto"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {img}
                </a>
              ) : (
                img
              )}
            </div>
          );
        })}
      </div>

      {/* Flechas de Navegación */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-[#4A3E3D] hover:bg-white/40 active:scale-95 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex shadow-sm cursor-pointer border border-white/30"
        aria-label="Anterior banner"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-[#4A3E3D] hover:bg-white/40 active:scale-95 transition-all duration-300 opacity-0 group-hover:opacity-100 hidden md:flex shadow-sm cursor-pointer border border-white/30"
        aria-label="Siguiente banner"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Puntos de Navegación */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                isActive ? "w-6 bg-white shadow-sm" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Ir al banner ${idx + 1}`}
            />
          );
        })}
      </div>
    </section>
  );
}
