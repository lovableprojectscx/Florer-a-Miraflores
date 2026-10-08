import { Link } from "@tanstack/react-router";
import type { ColeccionConCategoria } from "@/types/database";

import amor from "@/assets/product-box-romantico.webp";
import cumple from "@/assets/product-arreglo-especial.webp";
import nacimiento from "@/assets/product-novedad-aurora.webp";
import tulipanes from "@/assets/product-tulipanes.webp";
import rosas from "@/assets/product-novedad-velvet.webp";

const FALLBACK_IMGS = [amor, cumple, nacimiento, tulipanes, rosas];

// Fotografías de alta resolución oficiales de la boutique por categoría
const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "amor-aniversario":
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/categorias/1779372409571-r2k4cqrh1ke.webp",
  "graduacion":
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/categorias/1779373176544-az43foce4l.webp",
  "ofertas":
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/categorias/1779373331339-of9a7hhkfe.webp",
  "cumpleanos":
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1791156553038-2cwu53lgo9o.webp",
  "ramos":
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1791253748676-oaj7j18ejmf.webp",
  "tulipanes":
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1791156588496-nkqw1n2xy1.webp",
  "girasoles":
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1791156580844-o6v4btnji5p.webp",
};

interface Props {
  colecciones: ColeccionConCategoria[];
}

export function CategoryShowcase({ colecciones }: Props) {
  if (colecciones.length === 0) return null;

  return (
    <section id="categorias" className="px-5 md:px-12 lg:px-16 py-14 md:py-20 animate-fade-in-up bg-[#FAF8F5]/60">
      <div className="max-w-[1536px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <p className="font-body text-[11px] md:text-xs tracking-[0.2em] uppercase text-[#8A7A6E] mb-2 font-normal">
            — Colecciones exclusivas
          </p>
          <h2 className="font-display text-[#2C2420] text-3xl md:text-5xl lg:text-6xl leading-tight font-normal">
            Explora nuestras colecciones.
          </h2>
          <p className="mt-3 md:mt-4 font-body font-light text-[#2C2420]/75 text-sm md:text-base leading-relaxed">
            Cada ocasión merece una flor distinta. Diseños pensados para emocionar y sorprender.
          </p>
          <div className="mt-4">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 font-body text-xs tracking-[0.16em] uppercase text-[#2C2420]/70 hover:text-[#2C2420] border-b border-[#2C2420]/30 hover:border-[#2C2420] pb-1 transition-all group"
            >
              Ver todo el catálogo
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* Grid Collage Bento Editorial Asimétrico */}
        <div className="grid grid-cols-12 gap-4 sm:gap-5 lg:gap-6">
          {colecciones.map((col, i) => {
            const cat = col.categoria;
            if (!cat) return null;

            const img =
              col.imagen_custom_url ??
              cat.imagen_url ??
              DEFAULT_CATEGORY_IMAGES[cat.slug] ??
              FALLBACK_IMGS[i % FALLBACK_IMGS.length];

            const parentSlug = cat.padre?.slug ?? null;

            // Bento responsive classes according to position
            let gridSpan = "";
            let cardHeight = "";
            const isHero = i === 0;
            const isVerticalSide = i === 1;

            if (isHero) {
              gridSpan = "col-span-12 lg:col-span-8";
              cardHeight = "h-[340px] sm:h-[400px] lg:h-[480px]";
            } else if (isVerticalSide) {
              gridSpan = "col-span-12 sm:col-span-6 lg:col-span-4";
              cardHeight = "h-[260px] sm:h-[340px] lg:h-[480px]";
            } else if (i === 5 || (i === colecciones.length - 1 && (colecciones.length - 2) % 2 !== 0)) {
              // Cierre armonioso en pantallas móviles pequeñas para evitar tarjeta huérfana
              gridSpan = "col-span-12 sm:col-span-6 lg:col-span-3";
              cardHeight = "h-[200px] sm:h-[280px] lg:h-[320px]";
            } else {
              gridSpan = "col-span-6 lg:col-span-3";
              cardHeight = "h-[240px] sm:h-[280px] lg:h-[320px]";
            }

            const cardClasses = `group relative overflow-hidden bg-[#E8DDD0]/25 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 block ${gridSpan} ${cardHeight}`;

            const inner = (
              <>
                <img
                  src={img}
                  alt={cat.nombre}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMGS[i % FALLBACK_IMGS.length];
                  }}
                />

                {/* Gradiente dinámico según jerarquía */}
                <div
                  className={`absolute inset-0 transition-colors duration-500 ${
                    isHero
                      ? "bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:from-black/90"
                      : "bg-gradient-to-t from-black/80 via-black/25 to-transparent group-hover:from-black/85"
                  }`}
                />

                {/* Badge editorial superior para las primeras tarjetas */}
                {isHero && (
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                    <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-body font-medium text-white border border-white/30 shadow-xs">
                      Colección Destacada
                    </span>
                  </div>
                )}

                {isVerticalSide && (
                  <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5">
                    <span className="px-3 py-1 rounded-full bg-black/35 backdrop-blur-md text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-body text-white/95 border border-white/20 shadow-xs">
                      Exclusivo
                    </span>
                  </div>
                )}

                {/* Contenido textual adaptado al tamaño */}
                <div
                  className={`absolute inset-0 flex flex-col justify-end text-white ${
                    isHero
                      ? "p-6 sm:p-8 lg:p-10"
                      : isVerticalSide
                      ? "p-5 sm:p-6 lg:p-8"
                      : "p-4 sm:p-5"
                  }`}
                >
                  <p
                    className={`uppercase font-body font-light opacity-80 mb-1 ${
                      isHero
                        ? "text-[10px] sm:text-xs tracking-[0.22em]"
                        : "text-[9px] sm:text-[10px] tracking-[0.2em]"
                    }`}
                  >
                    {isHero ? "Edición de Autor" : "Colección"}
                  </p>

                  <h3
                    className={`font-display font-normal leading-snug drop-shadow-sm ${
                      isHero
                        ? "text-2xl sm:text-3xl lg:text-4xl"
                        : isVerticalSide
                        ? "text-xl sm:text-2xl lg:text-3xl"
                        : "text-base sm:text-lg lg:text-xl line-clamp-1"
                    }`}
                  >
                    {cat.nombre}
                  </h3>

                  {isHero && (
                    <p className="mt-2 font-body text-xs sm:text-sm text-white/85 font-light line-clamp-2 max-w-lg hidden sm:block">
                      Diseños florales concebidos con armonía, sensibilidad y las rosas más frescas de la boutique.
                    </p>
                  )}

                  <div className="mt-2.5 sm:mt-3 flex items-center">
                    {isHero ? (
                      <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#2C2420] text-xs font-body uppercase tracking-[0.16em] font-medium rounded-xl shadow-md group-hover:bg-[#FAF8F5] group-hover:translate-x-1 transition-all">
                        <span>Explorar Colección</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs tracking-[0.16em] uppercase font-body font-light text-white/90 group-hover:text-white transition-all">
                        <span>Explorar</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    )}
                  </div>
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
