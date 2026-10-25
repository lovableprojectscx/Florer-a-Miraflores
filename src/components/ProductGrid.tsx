import primavera from "@/assets/product-ramo-primavera.webp";
import especial from "@/assets/product-arreglo-especial.webp";
import romantico from "@/assets/product-box-romantico.webp";
import corona from "@/assets/product-corona.webp";
import tulipanes from "@/assets/product-tulipanes.webp";
import sorpresa from "@/assets/product-box-sorpresa.webp";
import { Link } from "@tanstack/react-router";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/data/catalog";
import type { ProductoRow, TagRow } from "@/types/database";
import { useState, useEffect, useRef } from "react";
import { getAllTags } from "@/lib/queries";
import { slugify } from "@/lib/utils";
import { getTagBadgeInfo } from "@/lib/tag-utils";
import { useVerMas } from "@/hooks/use-ver-mas";
import { imagenUrl, imagenSrcSet, onImageThumbError } from "@/lib/image-utils";
import { ResponsiveImage } from "@/components/ResponsiveImage";

// Data estática del home — se mantiene para compatibilidad
const defaultProducts = [
  { name: "Ramo Primavera", price: "S/. 85", img: primavera },
  { name: "Arreglo Especial", price: "S/. 120", img: especial },
  { name: "Box Romántico", price: "S/. 150", img: romantico },
  { name: "Corona Fúnebre", price: "S/. 200", img: corona },
  { name: "Ramo Tulipanes", price: "S/. 95", img: tulipanes },
  { name: "Box Sorpresa", price: "S/. 130", img: sorpresa },
];

interface ProductGridProps {
  /** Si se pasa, renderiza estos productos en lugar de los estáticos del home */
  products?: (Product | ProductoRow)[];
  /** Título de la sección — por defecto "Lo más pedido" */
  title?: string;
  /** Tamaño de lote para paginación incremental ("Ver más"). Si no se pasa, muestra todos sin paginar. */
  tamanoLote?: number;
}

export function ProductGrid({
  products: externalProducts,
  title,
  tamanoLote,
}: ProductGridProps = {}) {
  const { agregarItem, abrirCarrito } = useCartStore();
  const [tags, setTags] = useState<TagRow[]>([]);
  const paginacionActiva = typeof tamanoLote === "number" && tamanoLote > 0;
  const { visibles, total, mostrando, hayMas, verMas } = useVerMas(
    externalProducts ?? [],
    paginacionActiva ? tamanoLote : Math.max(externalProducts?.length ?? 24, 1),
  );
  const pendingFocusIndexRef = useRef<number | null>(null);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    getAllTags()
      .then((data) => {
        if (data) setTags(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pendingFocusIndexRef.current !== null) {
      const idx = pendingFocusIndexRef.current;
      pendingFocusIndexRef.current = null;
      const targetCard = articleRefs.current[idx];
      if (targetCard) {
        targetCard.focus({ preventScroll: true });
      }
    }
  }, [mostrando]);

  // ── Modo externo: productos reales pasados como prop
  if (externalProducts && externalProducts.length > 0) {
    const listaRender = paginacionActiva ? visibles : externalProducts;

    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3.5 sm:gap-x-5 md:gap-x-6 gap-y-7 md:gap-y-10">
          {listaRender.map((p, index) => {
            const firstTag = p.tags?.[0];
            const badgeInfo = getTagBadgeInfo(tags, firstTag);
            const label = badgeInfo?.label ?? null;
            const color = badgeInfo?.color ?? null;
            const fallbackClass = "bg-[#2C2420] text-white";
            const primeraImagen =
              Array.isArray(p.imagenes) && p.imagenes.length > 0 && p.imagenes[0]?.trim()
                ? p.imagenes[0]
                : romantico;

            return (
              <article
                key={p.id}
                ref={(el) => {
                  articleRefs.current[index] = el;
                }}
                tabIndex={-1}
                className="group flex flex-col w-full mx-auto bg-white border border-[#E8DDD0]/60 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C2420]"
              >
                <Link
                  to="/producto/$id"
                  params={{ id: `${slugify(p.nombre)}-${p.id}` }}
                  className="block flex-1 flex flex-col"
                >
                  <div className="relative overflow-hidden bg-[#FAF8F5] aspect-square">
                    {label && (
                      <span
                        className={`absolute top-3 left-3 z-10 px-2.5 py-1 text-[9px] tracking-widest uppercase font-body font-medium rounded-xs shadow-xs ${color ? "text-white" : fallbackClass}`}
                        style={color ? { backgroundColor: color } : undefined}
                      >
                        {label}
                      </span>
                    )}
                    <ResponsiveImage
                      url={primeraImagen}
                      fallbackUrl={primeraImagen || romantico}
                      anchoMiniatura={480}
                      anchosMiniatura={[480]}
                      alt={p.nombre}
                      loading="lazy"
                      sizes="(min-width: 1536px) 360px, (min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-105 will-change-transform"
                    />
                  </div>
                  <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-0.5">
                        Florería Miraflores
                      </p>
                      <div className="min-h-[2.6rem] sm:min-h-[2.75rem] flex items-center">
                        <h3 className="font-display text-base text-[#2C2420] group-hover:text-[#C4956A] transition-colors duration-200 line-clamp-2 leading-snug">
                          {p.nombre}
                        </h3>
                      </div>
                    </div>
                    <span className="font-body font-semibold text-[#2C2420] text-sm md:text-[15px] mt-1.5 block">
                      S/. {p.precio.toFixed(2)}{" "}
                      <span className="text-[10px] font-normal text-[#8A7A6E]">PEN</span>
                    </span>
                  </div>
                </Link>
                <div className="px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5 mt-auto">
                  <button
                    onClick={() => {
                      agregarItem({
                        id: p.id,
                        nombre: p.nombre,
                        precio: p.precio,
                        imagen: primeraImagen,
                      });
                      abrirCarrito();
                    }}
                    className="w-full h-9 sm:h-10 border border-[#2C2420] text-[#2C2420] text-[10px] tracking-widest uppercase font-body hover:bg-[#2C2420] hover:text-white transition-colors duration-300 rounded-lg cursor-pointer flex items-center justify-center font-medium"
                  >
                    Agregar al carrito
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {paginacionActiva && (
          <div className="mt-10 md:mt-12 flex flex-col items-center gap-4">
            <p
              aria-live="polite"
              className="font-body text-xs tracking-widest uppercase text-[#8A7A6E]"
            >
              Mostrando {mostrando} de {total}
            </p>
            {hayMas && (
              <button
                type="button"
                onClick={() => {
                  pendingFocusIndexRef.current = mostrando;
                  verMas();
                }}
                className="px-8 h-11 border border-[#2C2420] text-[#2C2420] text-[11px] tracking-widest uppercase font-body hover:bg-[#2C2420] hover:text-white transition-colors duration-300 rounded-lg cursor-pointer flex items-center justify-center font-medium"
              >
                Ver más
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Modo home: productos estáticos (comportamiento original)
  return (
    <section id="catalogo" className="px-4 sm:px-6 lg:px-12 py-12 md:py-16">
      <div className="max-w-[1536px] mx-auto">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <p className="font-italic-serif text-rose-accent text-base md:text-lg mb-2">
              — selección de la casa
            </p>
            <h2 className="font-display text-foreground text-3xl sm:text-4xl md:text-5xl">
              {title ?? "Lo más pedido"}
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="hidden md:inline-block text-[11px] tracking-widest uppercase font-body font-light text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-10">
          {defaultProducts.map((p) => (
            <article
              key={p.name}
              className="group flex flex-col w-full mx-auto bg-white border border-[#E8DDD0]/60 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
            >
              <div className="relative overflow-hidden bg-ivory-soft aspect-[3/4]">
                <img
                  src={p.img}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-105 will-change-transform"
                />
              </div>
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-body font-light text-[10px] tracking-widest uppercase text-[#8A7A6E] mb-1">
                    Florería Miraflores
                  </p>
                  <p className="font-display text-base text-foreground leading-tight line-clamp-1">
                    {p.name}
                  </p>
                </div>
                <p className="mt-2 font-body font-semibold text-[#2C2420] text-sm">
                  {p.price} <span className="text-[10px] font-normal text-[#8A7A6E]">PEN</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
