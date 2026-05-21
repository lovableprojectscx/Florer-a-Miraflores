import primavera from "@/assets/product-ramo-primavera.jpg";
import especial from "@/assets/product-arreglo-especial.jpg";
import romantico from "@/assets/product-box-romantico.jpg";
import corona from "@/assets/product-corona.jpg";
import tulipanes from "@/assets/product-tulipanes.jpg";
import sorpresa from "@/assets/product-box-sorpresa.jpg";
import { Link } from "@tanstack/react-router";
import { useCartStore } from "@/store/cart";
import type { Product } from "@/data/catalog";
import type { ProductoRow } from "@/types/database";

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

  // ── Modo externo: productos reales pasados como prop
  if (externalProducts && externalProducts.length > 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 md:gap-x-5 gap-y-6 md:gap-y-10">
        {externalProducts.map((p) => {
          const firstTag = p.tags[0];
          const badge = firstTag ? BADGE_MAP[firstTag] : null;

          return (
            <article
              key={p.id}
              className="group flex flex-col w-full max-w-[290px] mx-auto md:mx-0"
            >
              <Link to="/producto/$id" params={{ id: p.id }} className="block">
                <div
                  className="relative overflow-hidden bg-ivory-soft"
                  style={{ aspectRatio: "1/1" }}
                >
                  {badge && (
                    <span
                      className={`absolute top-3 left-3 z-10 px-2 py-1 text-[9px] tracking-widest uppercase font-body font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  )}
                  <img
                    src={p.imagenes[0]}
                    alt={p.nombre}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = romantico;
                    }}
                  />
                </div>
                <div className="pt-4">
                  <p className="text-[10px] tracking-wider-2 uppercase font-body font-light text-[#8A7A6E]">
                    Miraflores Boutique
                  </p>
                  <div className="flex items-baseline justify-between mt-1.5">
                    <h3 className="font-body font-light text-base text-[#2C2420]">{p.nombre}</h3>
                    <span className="font-body font-light text-[#2C2420] ml-2 flex-shrink-0">
                      S/ {p.precio.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Link>
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
                className="mt-4 w-full h-11 border border-[#2C2420]/80 text-[#2C2420] text-[11px] tracking-wider-2 uppercase font-body font-light hover:bg-[#2C2420] hover:text-white transition-colors duration-300"
              >
                Agregar al carrito
              </button>
            </article>
          );
        })}
      </div>
    );
  }

  // ── Modo home: productos estáticos (comportamiento original)
  return (
    <section id="catalogo" className="px-6 md:px-10 lg:px-16 py-12 md:py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <p className="font-italic-serif text-rose-accent text-base md:text-lg mb-2">
              — selección de la casa
            </p>
            <h2 className="font-display text-foreground text-4xl md:text-5xl lg:text-6xl">
              {title ?? "Lo más pedido"}
            </h2>
          </div>
          <a
            href="#"
            className="hidden md:inline-block text-[12px] tracking-wider-2 uppercase font-body font-light text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos →
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-10">
          {defaultProducts.map((p) => (
            <article
              key={p.name}
              className="group flex flex-col w-full max-w-[290px] mx-auto md:mx-0"
            >
              <div
                className="relative overflow-hidden bg-ivory-soft"
                style={{ aspectRatio: "1/1" }}
              >
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-5">
                <p className="font-body font-light text-[11px] tracking-widest uppercase text-muted-foreground mb-1.5">
                  Floreria Miraflores
                </p>
                <p className="font-display text-xl text-foreground leading-tight">{p.name}</p>
                <p className="mt-2 font-body font-light text-muted-foreground text-sm">{p.price}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
