import { Link } from "@tanstack/react-router";
import { useCartStore } from "@/store/cart";
import type { ProductoRow } from "@/types/database";

import pampas from "@/assets/product-novedad-pampas.jpg";
import velvet from "@/assets/product-novedad-velvet.jpg";
import aurora from "@/assets/product-novedad-aurora.jpg";

const FALLBACK = [
  {
    id: "aurora",
    nombre: "Aurora",
    descripcion: "Rosas durazno y ranunculos crema",
    precio: 165,
    imagenes: [aurora],
    tags: ["novedad"] as const,
    categoria_id: null,
    activo: true,
    orden: 0,
    created_at: "",
  },
  {
    id: "velvet-box",
    nombre: "Velvet Box",
    descripcion: "Caja redonda con rosas rojas terciopelo",
    precio: 220,
    imagenes: [velvet],
    tags: ["edicion_limitada"] as const,
    categoria_id: null,
    activo: true,
    orden: 1,
    created_at: "",
  },
  {
    id: "pampas-sculpt",
    nombre: "Pampas Sculpt",
    descripcion: "Pampas, palma seca y orquideas blancas",
    precio: 280,
    imagenes: [pampas],
    tags: ["novedad"] as const,
    categoria_id: null,
    activo: true,
    orden: 2,
    created_at: "",
  },
];

const BADGE_MAP: Record<string, string> = {
  novedad: "Nuevo",
  edicion_limitada: "Edicion limitada",
  oferta: "Oferta",
  mas_vendido: "Mas vendido",
};

interface Props {
  productos: ProductoRow[];
}

export function Novedades({ productos }: Props) {
  const { agregarItem, abrirCarrito } = useCartStore();
  const items = productos.length > 0 ? productos : (FALLBACK as unknown as ProductoRow[]);

  return (
    <section id="novedades" className="px-5 md:px-10 lg:px-16 py-12 md:py-28 bg-ivory-soft/60">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl">
          <p className="font-italic-serif text-rose-accent text-sm md:text-lg mb-1 md:mb-2">
            -- lanzamientos especiales
          </p>
          <h2 className="font-display text-foreground text-3xl md:text-5xl lg:text-6xl leading-tight">
            Nuestras novedades favoritas.
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-8 md:gap-y-14 mt-8 md:mt-20">
          {items.map((p) => {
            const firstTag = p.tags?.[0];
            const badgeLabel = firstTag ? BADGE_MAP[firstTag] : null;
            const imgSrc = p.imagenes?.[0] ?? "";

            return (
              <article
                key={p.id}
                className="group flex flex-col w-full max-w-[290px] mx-auto md:mx-0"
              >
                <Link to="/producto/$id" params={{ id: p.id }} className="block">
                  <div className="relative overflow-hidden bg-ivory" style={{ aspectRatio: "1/1" }}>
                    {badgeLabel && (
                      <span className="absolute top-4 left-4 z-10 bg-foreground text-primary-foreground text-[10px] tracking-widest uppercase font-body font-light px-3 py-1">
                        {badgeLabel}
                      </span>
                    )}
                    <img
                      src={imgSrc}
                      alt={p.nombre}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-4 flex-1 flex flex-col">
                    <p className="font-display text-foreground text-lg md:text-2xl leading-tight">
                      {p.nombre}
                    </p>
                    {p.descripcion && (
                      <p className="mt-1 font-body font-light text-foreground/60 text-sm line-clamp-2">
                        {p.descripcion}
                      </p>
                    )}
                    <p className="mt-2 font-body font-medium text-foreground text-sm">
                      S/ {p.precio.toFixed(2)}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    agregarItem({
                      id: p.id,
                      nombre: p.nombre,
                      precio: p.precio,
                      imagen: p.imagenes?.[0] ?? "",
                      cantidad: 1,
                    });
                    abrirCarrito();
                  }}
                  className="mt-3 w-full h-10 border border-foreground text-foreground font-body text-[10px] tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
                >
                  Agregar al carrito
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
