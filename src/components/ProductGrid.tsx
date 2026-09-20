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
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

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
}

const BADGE_MAP: Record<string, { label: string; className: string }> = {
  novedad: { label: "NUEVO", className: "bg-[#2C2420] text-white" },
  edicion_limitada: { label: "EDICIÓN LIMITADA", className: "bg-[#2C2420] text-white" },
  oferta: { label: "OFERTA", className: "bg-[#C4956A] text-white" },
  mas_vendido: { label: "MÁS VENDIDO", className: "bg-[#8A7A6E] text-white" },
};

export function ProductGrid({ products: externalProducts, title }: ProductGridProps = {}) {
  const { agregarItem, abrirCarrito } = useCartStore();
  const [tags, setTags] = useState<TagRow[]>([]);

  useEffect(() => {
    supabase
      .from("tags")
      .select("*")
      .then(({ data }: { data: any }) => {
        if (data) setTags(data);
      });
  }, []);

  // ── Modo externo: productos reales pasados como prop
  if (externalProducts && externalProducts.length > 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 md:gap-x-6 gap-y-8 md:gap-y-10">
        {externalProducts.map((p) => {
          const firstTag = p.tags?.[0];
          const tagObj = tags.find((t) => t.clave === firstTag);
          const label = tagObj ? tagObj.nombre.toUpperCase() : (firstTag ? (BADGE_MAP[firstTag]?.label ?? firstTag.toUpperCase()) : null);
          const color = tagObj ? tagObj.color_badge : null;
          const fallbackClass = firstTag ? (BADGE_MAP[firstTag]?.className ?? "bg-[#2C2420] text-white") : "";

          return (
            <article
              key={p.id}
              className="group flex flex-col w-full mx-auto bg-white border border-[#E8DDD0]/60 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
            >
              <Link to="/producto/$id" params={{ id: `${slugify(p.nombre)}-${p.id}` }} className="block">
                <div
                  className="relative overflow-hidden bg-[#FAF8F5] aspect-[3/4]"
                >
                  {label && (
                    <span
                      className={`absolute top-3 left-3 z-10 px-2.5 py-1 text-[9px] tracking-widest uppercase font-body font-medium rounded-xs shadow-xs ${color ? "text-white" : fallbackClass}`}
                      style={color ? { backgroundColor: color } : undefined}
                    >
                      {label}
                    </span>
                  )}
                  <img
                    src={p.imagenes[0]}
                    alt={p.nombre}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-105 will-change-transform"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = romantico;
                    }}
                  />
                </div>
                <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] tracking-widest uppercase font-body font-light text-[#8A7A6E] mb-1">
                      Florería Miraflores
                    </p>
                    <h3 className="font-display text-base text-[#2C2420] group-hover:text-[#C4956A] transition-colors duration-200 line-clamp-1">
                      {p.nombre}
                    </h3>
                  </div>
                  <span className="font-body font-semibold text-[#2C2420] text-sm md:text-[15px] mt-2 block">
                    S/. {p.precio.toFixed(2)} <span className="text-[10px] font-normal text-[#8A7A6E]">PEN</span>
                  </span>
                </div>
              </Link>
              <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 mt-auto">
                <button
                  onClick={() => {
                    agregarItem({
                      id: p.id,
                      nombre: p.nombre,
                      precio: p.precio,
                      imagen: p.imagenes[0],
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
              <div
                className="relative overflow-hidden bg-ivory-soft aspect-[3/4]"
              >
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
                  <p className="font-display text-base text-foreground leading-tight line-clamp-1">{p.name}</p>
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
