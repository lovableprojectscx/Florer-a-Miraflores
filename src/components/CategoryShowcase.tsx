import { Link } from "@tanstack/react-router";
import type { ColeccionConCategoria } from "@/types/database";
import { ResponsiveImage } from "@/components/ResponsiveImage";

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
  graduacion:
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/categorias/1779373176544-az43foce4l.webp",
  ofertas:
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/categorias/1779373331339-of9a7hhkfe.webp",
  cumpleanos:
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1791156553038-2cwu53lgo9o.webp",
  ramos:
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1791253748676-oaj7j18ejmf.webp",
  tulipanes:
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1791156588496-nkqw1n2xy1.webp",
  girasoles:
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1791156580844-o6v4btnji5p.webp",
};

interface Props {
  colecciones: ColeccionConCategoria[];
}

export function CategoryShowcase({ colecciones }: Props) {
  if (colecciones.length === 0) return null;

  return (
    <section
      id="categorias"
      className="px-5 md:px-12 lg:px-16 py-8 md:py-12 animate-fade-in-up bg-[#FAF8F5]/60"
    >
      <div className="max-w-[1380px] mx-auto">
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

            // Bento responsive classes according to position y regla móvil sin tarjetas huérfanas
            const totalColecciones = colecciones.length;
            const isHero = i === 0;
            const isVerticalSide = i === 1;
            // Si lo que queda tras la 1ª es impar, la 2ª también va a todo el ancho en móvil para que el resto quede par
            const segundaAnchoEnMovil = (totalColecciones - 1) % 2 !== 0;

            let gridSpan = "";
            let cardHeight = "";

            if (isHero) {
              gridSpan = "col-span-12 lg:col-span-8";
              cardHeight = "h-[300px] sm:h-[360px] lg:h-[410px]";
            } else if (isVerticalSide) {
              gridSpan = segundaAnchoEnMovil
                ? "col-span-12 sm:col-span-6 lg:col-span-4"
                : "col-span-6 sm:col-span-6 lg:col-span-4";
              cardHeight = segundaAnchoEnMovil
                ? "h-[250px] sm:h-[300px] lg:h-[410px]"
                : "h-[220px] sm:h-[240px] lg:h-[410px]";
            } else {
              // Todas las tarjetas pequeñas restantes van en 2 columnas con la MISMA altura exacta
              gridSpan = "col-span-6 sm:col-span-6 lg:col-span-3";
              cardHeight = "h-[220px] sm:h-[240px] lg:h-[280px]";
            }

            const cardClasses = `group relative overflow-hidden bg-[#E8DDD0]/25 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 block ${gridSpan} ${cardHeight}`;

            const inner = (
              <>
                <ResponsiveImage
                  url={img}
                  fallbackUrl={img || FALLBACK_IMGS[i % FALLBACK_IMGS.length]}
                  anchoMiniatura={isHero ? 960 : 480}
                  originalWidth={isHero ? 1600 : undefined}
                  sizes={
                    isHero
                      ? "(max-width: 1024px) 100vw, 66vw"
                      : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  }
                  alt={cat.nombre}
                  loading={i < 2 ? "eager" : "lazy"}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
                />

                {/* Badge editorial superior para las primeras tarjetas */}
                {isHero && (
                  <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                    <span className="px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] sm:text-[11px] tracking-[0.2em] uppercase font-body font-medium text-[#2C2420] border border-[#E8DDD0]/80 shadow-xs">
                      Colección Destacada
                    </span>
                  </div>
                )}

                {isVerticalSide && (
                  <div className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-body font-medium text-[#2C2420] border border-[#E8DDD0]/80 shadow-xs">
                      Exclusivo
                    </span>
                  </div>
                )}

                {/* Contenido textual en cápsula blanca limpia (sin sombreado oscuro en la foto) */}
                {isHero ? (
                  <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 p-4 sm:p-6 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E8DDD0]/60 shadow-sm flex flex-col justify-between sm:flex-row sm:items-center gap-3 transition-all duration-300 group-hover:shadow-md">
                    <div>
                      <p className="text-[10px] sm:text-xs tracking-[0.22em] uppercase font-body text-[#8A7A6E] font-medium mb-0.5">
                        Edición de Autor
                      </p>
                      <h3 className="font-display font-normal text-xl sm:text-3xl text-[#2C2420] leading-tight">
                        {cat.nombre}
                      </h3>
                      <p className="mt-1 font-body text-xs sm:text-sm text-[#2C2420]/75 font-light line-clamp-1 hidden md:block">
                        Diseños florales concebidos con armonía, sensibilidad y las rosas más
                        frescas.
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-[#2C2420] text-white text-xs font-body uppercase tracking-[0.16em] font-medium rounded-xl group-hover:bg-[#1a1513] transition-all">
                        <span>Explorar Colección</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 p-3 sm:p-4 bg-white/95 backdrop-blur-md rounded-xl border border-[#E8DDD0]/60 shadow-sm transition-all duration-300 group-hover:shadow-md flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase font-body text-[#8A7A6E] font-medium mb-0.5">
                        Colección
                      </p>
                      <h3 className="font-display font-normal text-sm sm:text-base lg:text-lg text-[#2C2420] leading-snug line-clamp-1">
                        {cat.nombre}
                      </h3>
                    </div>
                    <div className="mt-1.5 sm:mt-2 flex items-center">
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-[0.16em] uppercase font-body font-medium text-[#2C2420]/80 group-hover:text-[#2C2420] transition-colors">
                        <span>Explorar</span>
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                  </div>
                )}
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
