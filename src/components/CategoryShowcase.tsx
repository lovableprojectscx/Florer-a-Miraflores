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
    <section id="categorias" className="px-5 md:px-10 lg:px-16 py-10 md:py-14 animate-fade-in-up">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-6 md:mb-10">
          <div className="max-w-xl">
            <p className="font-italic-serif text-rose-accent text-sm md:text-lg mb-1 md:mb-2">
              — encuentra tu arreglo
            </p>
            <h2 className="font-display text-foreground text-3xl md:text-5xl lg:text-6xl leading-tight">
              Explora nuestras colecciones.
            </h2>
            <p className="mt-3 md:mt-5 font-body font-light text-foreground/75 text-sm md:text-lg">
              Cada ocasión merece una flor distinta. Elige la categoría y encuentra la pieza
              perfecta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {colecciones.map((col, i) => {
            const cat = col.categoria;
            if (!cat) return null;

            const img =
              col.imagen_custom_url ?? cat.imagen_url ?? FALLBACK_IMGS[i % FALLBACK_IMGS.length];

            const parentSlug = cat.padre?.slug ?? null;
            const cardClasses = `group relative overflow-hidden bg-ivory-soft rounded-xl ${
              i === 0
                ? "col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto md:h-full"
                : "col-span-1 aspect-[4/3] md:aspect-square"
            }`;

            const inner = (
              <>
                <img
                  src={img}
                  alt={cat.nombre}
                  loading={i === 0 ? undefined : "lazy"}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMGS[i % FALLBACK_IMGS.length];
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent group-hover:from-foreground/90 transition-all duration-500" />
                <div className="absolute inset-0 p-4 md:p-7 flex flex-col justify-end text-primary-foreground">
                  <p className="text-[9px] md:text-[10px] tracking-wider-2 uppercase font-body font-light opacity-80">
                    Colección
                  </p>
                  <h3
                    className={`font-display mt-1 leading-tight ${
                      i === 0 ? "text-2xl md:text-5xl" : "text-lg md:text-2xl"
                    }`}
                  >
                    {cat.nombre}
                  </h3>
                  <span className="mt-3 md:mt-4 inline-flex items-center gap-2 text-[10px] tracking-wider-2 uppercase font-body font-light opacity-80 md:opacity-0 md:-translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300">
                    Ver colección <span aria-hidden>→</span>
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
