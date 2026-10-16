import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, ArrowRight, Camera } from "lucide-react";
import type { RecuerdoRow, CategoriaRow, DistritoRow } from "@/types/database";
import { RecuerdoCard } from "@/components/RecuerdoCard";

interface HomeRecuerdosProps {
  recuerdos: RecuerdoRow[];
  categorias?: CategoriaRow[];
  distritos?: DistritoRow[];
}

export function HomeRecuerdos({ recuerdos, categorias = [], distritos = [] }: HomeRecuerdosProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Regla estricta: Si hay 0 recuerdos publicados, la franja NO se renderiza
  // (ni título, ni contenedor, ni hueco en el layout).
  if (!recuerdos || recuerdos.length === 0) {
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

  return (
    <section
      className="py-14 md:py-20 bg-white border-b border-[#E8DDD0]/50 overflow-hidden"
      data-testid="home-recuerdos-section"
      aria-label="Recuerdos de entrega"
    >
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] tracking-[0.25em] uppercase font-body text-[#8A7A6E]">
                Entregas Reales
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C4848A] bg-[#C4848A]/10 px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3 text-[#C4848A]" />
                Momentos en Lima
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[#2C2420]">
              Recuerdos de entrega
            </h2>
            <p className="mt-1 font-body font-light text-xs sm:text-sm text-[#8A7A6E]">
              Fotografías de entregas reales compartidas con el cariño de nuestros clientes.
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Controles de navegación de carrusel */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                className="w-9 h-9 rounded-full border border-[#E8DDD0] bg-white flex items-center justify-center text-[#2C2420] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#2C2420] transition-colors"
                aria-label="Desplazar recuerdos hacia la izquierda"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                className="w-9 h-9 rounded-full border border-[#E8DDD0] bg-white flex items-center justify-center text-[#2C2420] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#2C2420] transition-colors"
                aria-label="Desplazar recuerdos hacia la derecha"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Link
              to="/recuerdos"
              className="inline-flex items-center gap-1.5 text-xs font-body tracking-wider uppercase text-[#C4848A] hover:text-[#2C2420] font-medium transition-colors ml-2"
              data-testid="ver-todos-recuerdos-link"
            >
              <span>Ver todos los recuerdos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Carrusel horizontal idéntico al de reseñas */}
        <div
          ref={sliderRef}
          onScroll={checkScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory py-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {recuerdos.map((recuerdo) => (
            <div
              key={recuerdo.id}
              className="w-[75vw] sm:w-[280px] md:w-[320px] lg:w-[340px] shrink-0 snap-start"
            >
              <RecuerdoCard recuerdo={recuerdo} categorias={categorias} distritos={distritos} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
