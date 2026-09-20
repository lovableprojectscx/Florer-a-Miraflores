import { Link } from "@tanstack/react-router";
import type { ColeccionConCategoria } from "@/types/database";

import amor from "@/assets/product-box-romantico.webp";
import cumple from "@/assets/product-arreglo-especial.webp";
import nacimiento from "@/assets/product-novedad-aurora.webp";
import tulipanes from "@/assets/product-tulipanes.webp";
import rosas from "@/assets/product-novedad-velvet.webp";

const FALLBACK_IMGS = [amor, cumple, nacimiento, tulipanes, rosas];

interface Props {
  colecciones: ColeccionConCategoria[];
}

export function CategoryShowcase({ colecciones }: Props) {
  if (colecciones.length === 0) return null;

  return (
    <section id="categorias" className="px-5 md:px-12 lg:px-16 py-14 md:py-20 animate-fade-in-up bg-[#FAF8F5]/60">
      <div className="max-w-[1536px] mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-8 md:mb-12">
          <div className="max-w-xl">
            <p className="font-body text-[11px] md:text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-2 font-normal">
              — Colecciones exclusivas
            </p>
            <h2 className="font-display text-[#2C2420] text-3xl md:text-5xl lg:text-6xl leading-tight font-normal">
              Explora nuestras colecciones.
            </h2>
            <p className="mt-3 md:mt-4 font-body font-light text-[#2C2420]/75 text-sm md:text-base leading-relaxed">
              Cada ocasión merece una flor distinta. Diseños pensados para emocionar y sorprender.
            </p>
          </div>

          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 font-body text-xs tracking-[0.16em] uppercase text-[#2C2420]/70 hover:text-[#2C2420] border-b border-[#2C2420]/30 hover:border-[#2C2420] pb-1 transition-all group"
          >
            Ver todo el catálogo
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Grid equilibrado de tarjetas fotográficas con proporción vertical editorial 3:4 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5 md:gap-6">
          {colecciones.map((col, i) => {
            const cat = col.categoria;
            if (!cat) return null;

            const img =
              col.imagen_custom_url ?? cat.imagen_url ?? FALLBACK_IMGS[i % FALLBACK_IMGS.length];

            const parentSlug = cat.padre?.slug ?? null;
            const cardClasses =
              "group relative overflow-hidden bg-[#E8DDD0]/20 rounded-lg aspect-[3/4] shadow-sm hover:shadow-md transition-all duration-500 block";

            const inner = (
              <>
                <img
                  src={img}
                  alt={cat.nombre}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMGS[i % FALLBACK_IMGS.length];
                  }}
                />
                {/* Gradiente sutil para legibilidad de texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:from-black/85 transition-colors duration-500" />
                <div className="absolute inset-0 p-4 sm:p-5 md:p-6 flex flex-col justify-end text-white">
                  <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-body font-light opacity-80 mb-1">
                    Colección
                  </p>
                  <h3 className="font-display text-lg sm:text-xl md:text-2xl font-normal leading-snug drop-shadow-sm">
                    {cat.nombre}
                  </h3>
                  <span className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] tracking-[0.18em] uppercase font-body font-light text-white/90 group-hover:text-white transition-all">
                    Explorar <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </>
            );

            // Si es subcategoría, navegar a /categoria/:padre/:slug
            if (parentSlug) {
              return (
                <Link
                  key={col.id}
                  to="/categoria/$slug/$sub"
                  params={{ slug: parentSlug, sub: cat.slug }}
                  className={cardClasses}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <Link
                key={col.id}
                to="/categoria/$slug"
                params={{ slug: cat.slug }}
                className={cardClasses}
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
