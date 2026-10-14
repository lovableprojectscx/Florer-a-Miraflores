import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ArrowRight, Star } from "lucide-react";
import type { TestimonioRow, ConfigRow } from "@/types/database";
import { ResenaCard } from "@/components/ResenaCard";
import { shouldShowHomeTestimonios, formatGoogleSummary } from "@/lib/resenas-utils";

interface HomeTestimoniosProps {
  testimonios: TestimonioRow[];
  config: ConfigRow | null;
}

export function HomeTestimonios({ testimonios, config }: HomeTestimoniosProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Regla estricta: Solo aparece si mostrar_resenas_home = true Y hay al menos 3 activas
  if (!shouldShowHomeTestimonios(config?.mostrar_resenas_home, testimonios.length)) {
    return null;
  }

  const checkScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (direction: "left" | "right") => {
    if (!sliderRef.current) return;
    const offset = sliderRef.current.clientWidth * 0.8;
    sliderRef.current.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  const googleSummary = formatGoogleSummary(config?.google_rating, config?.google_reviews_count);

  return (
    <section
      className="py-14 md:py-20 bg-[#FAF8F5]/60 border-t border-b border-[#E8DDD0]/50 overflow-hidden"
      data-testid="home-testimonios-section"
      aria-label="Reseñas de clientes"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] tracking-[0.25em] uppercase font-body text-[#8A7A6E]">
                Experiencias Reales
              </span>
              {googleSummary && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4285F4] bg-[#4285F4]/10 px-2 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-[#E0A96D] text-[#E0A96D]" />
                  {googleSummary}
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#2C2420]">
              Lo que dicen nuestros clientes
            </h2>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Controles de navegación */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                className="w-9 h-9 rounded-full border border-[#E8DDD0] bg-white flex items-center justify-center text-[#2C2420] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#2C2420] transition-colors"
                aria-label="Desplazar reseñas hacia la izquierda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                className="w-9 h-9 rounded-full border border-[#E8DDD0] bg-white flex items-center justify-center text-[#2C2420] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#2C2420] transition-colors"
                aria-label="Desplazar reseñas hacia la derecha"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              to="/resenas"
              className="inline-flex items-center gap-1.5 text-xs font-body tracking-wider uppercase text-[#C4848A] hover:text-[#2C2420] font-medium transition-colors ml-2"
              data-testid="ver-todas-resenas-link"
            >
              <span>Ver todas las reseñas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Carrusel horizontal (mismo patrón borde a borde de Novedades) */}
        <div
          ref={sliderRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {testimonios.map((testimonio) => (
            <div
              key={testimonio.id}
              className="w-[85vw] sm:w-[340px] md:w-[380px] lg:w-[420px] shrink-0 snap-start"
            >
              <ResenaCard testimonio={testimonio} clampText={true} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
