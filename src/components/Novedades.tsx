import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import type { ProductoRow, TagRow } from "@/types/database";

import pampas from "@/assets/product-novedad-pampas.webp";
import velvet from "@/assets/product-novedad-velvet.webp";
import aurora from "@/assets/product-novedad-aurora.webp";

// ─── Fallback cuando no hay datos en Supabase ────────────────────────────────

const FALLBACK_TAG: TagRow = {
  id: "fallback",
  clave: "novedad",
  nombre: "Lanzamientos especiales",
  descripcion: "Nuestras creaciones más recientes, elaboradas con las flores de la temporada.",
  color_badge: "#2C2420",
  orden: 1,
  activo: true,
  mostrar_en_home: true,
};

const FALLBACK_PRODUCTOS: ProductoRow[] = [
  {
    id: "aurora",
    nombre: "Aurora",
    descripcion: "Rosas durazno y ranúnculos crema",
    precio: 165,
    imagenes: [aurora],
    tags: ["novedad"],
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
    tags: ["edicion_limitada"],
    categoria_id: null,
    activo: true,
    orden: 1,
    created_at: "",
  },
  {
    id: "pampas-sculpt",
    nombre: "Pampas Sculpt",
    descripcion: "Pampas, palma seca y orquídeas blancas",
    precio: 280,
    imagenes: [pampas],
    tags: ["novedad"],
    categoria_id: null,
    activo: true,
    orden: 2,
    created_at: "",
  },
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TagSeccion {
  tag: TagRow;
  productos: ProductoRow[];
}

interface Props {
  tagSecciones: TagSeccion[];
}

// ─── Subcomponente: Card de producto ─────────────────────────────────────────

function ProductCard({
  producto,
  badgeLabel,
  badgeColor,
  className = "flex",
}: {
  producto: ProductoRow;
  badgeLabel: string;
  badgeColor: string;
  className?: string;
}) {
  const { agregarItem, abrirCarrito } = useCartStore();
  const imgSrc = producto.imagenes?.[0] ?? "";

  return (
    <article className={`group flex-col flex-shrink-0 w-[240px] md:w-full md:max-w-[290px] mx-auto md:mx-0 snap-start bg-white border border-[#E8DDD0] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <Link to="/producto/$id" params={{ id: producto.id }} className="block">
        <div className="relative overflow-hidden bg-ivory" style={{ aspectRatio: "3/4" }}>
          {/* Badge del tag */}
          <span
            className="absolute top-3 left-3 z-10 text-white text-[9px] tracking-[0.18em] uppercase font-body font-light px-3 py-1.5 leading-none rounded-sm"
            style={{ backgroundColor: badgeColor }}
          >
            {badgeLabel}
          </span>

          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[600ms] ease-out md:group-hover:scale-[1.04] will-change-transform"
          />
        </div>

        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-[#2C2420] text-base md:text-lg leading-snug group-hover:text-[#C4956A] transition-colors duration-200 line-clamp-1">
              {producto.nombre}
            </h3>
            {producto.descripcion ? (
              <p className="mt-1 font-body font-light text-[#8A7A6E] text-xs line-clamp-2 min-h-[2rem]">
                {producto.descripcion}
              </p>
            ) : (
              <div className="mt-1 min-h-[2rem]" />
            )}
          </div>
          <p className="mt-3 font-body font-semibold text-[#2C2420] text-sm md:text-base">
            S/ {producto.precio.toFixed(2)}
          </p>
        </div>
      </Link>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4 mt-auto">
        <button
          onClick={() => {
            agregarItem({
              id: producto.id,
              nombre: producto.nombre,
              precio: producto.precio,
              imagen: producto.imagenes?.[0] ?? "",
              cantidad: 1,
            });
            abrirCarrito();
          }}
          className="w-full h-10 border border-[#2C2420] text-[#2C2420] font-body text-[9px] sm:text-[10px] tracking-wider sm:tracking-widest uppercase hover:bg-[#2C2420] hover:text-white transition-colors duration-300 rounded-md"
        >
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}

// ─── Subcomponente: Sección de un tag ────────────────────────────────────────

function TagSection({ tag, productos }: TagSeccion) {
  const visibles = productos.slice(0, 6);
  const mostrarBoton = productos.length > 4;
  const hayMasMobile = productos.length > 5;

  return (
    <section
      id={`tag-${tag.clave}`}
      className="px-5 md:px-10 lg:px-16 py-14 md:py-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 md:mb-16">
          <div className="max-w-2xl">
            {/* Indicador del tag */}
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color_badge }}
              />
              <span
                className="font-body text-[10px] tracking-[0.22em] uppercase font-medium"
                style={{ color: tag.color_badge }}
              >
                {tag.clave.replace(/_/g, " ")}
              </span>
            </div>

            <h2 className="font-display text-foreground text-3xl md:text-5xl leading-tight">
              {tag.nombre}
            </h2>

            {tag.descripcion && (
              <p className="mt-3 font-body font-light text-foreground/60 text-sm md:text-base leading-relaxed max-w-lg">
                {tag.descripcion}
              </p>
            )}
          </div>

          {/* Botón "Ver todos" — solo desktop, si hay más de 4 */}
          {mostrarBoton && (
            <Link
              to="/tag/$key"
              params={{ key: tag.clave }}
              className="hidden md:inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase text-foreground/60 hover:text-foreground border-b border-foreground/20 hover:border-foreground/60 pb-0.5 transition-colors group flex-shrink-0"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Slider horizontal en móvil y PC para mantener tamaño original de tarjetas */}
        <div className="flex overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 gap-x-4 md:gap-x-8 pb-4 snap-x snap-mandatory scrollbar-none">
          {visibles.map((p, idx) => (
            <ProductCard
              key={p.id}
              producto={p}
              badgeLabel={tag.nombre}
              badgeColor={tag.color_badge}
              className={idx === 5 ? "hidden md:flex" : "flex"}
            />
          ))}

          {hayMasMobile && (
            <Link
              to="/tag/$key"
              params={{ key: tag.clave }}
              className="md:hidden flex-shrink-0 w-[240px] flex flex-col justify-center items-center p-6 border border-dashed border-[#C4956A]/60 bg-[#F5EFE6]/30 hover:bg-[#F5EFE6]/60 hover:border-[#C4956A] transition-colors snap-start text-center group self-stretch min-h-[300px]"
            >
              <span className="font-italic-serif text-rose-accent text-xs mb-1">
                Colección completa
              </span>
              <span className="font-display text-xl text-[#2C2420] mb-4">
                Ver todos
              </span>
              <div className="w-10 h-10 rounded-full bg-[#2C2420] text-white flex items-center justify-center group-hover:bg-[#C4956A] transition-colors duration-300">
                <ArrowRight className="h-5 w-5" />
              </div>
            </Link>
          )}
        </div>

        {/* Botón premium de ver catálogo completo */}
        {mostrarBoton && (
          <div className="flex justify-center mt-10 md:mt-16">
            <Link
              to="/tag/$key"
              params={{ key: tag.clave }}
              className="inline-flex items-center justify-center px-8 py-3.5 border border-[#2C2420] text-[#2C2420] font-body text-xs tracking-widest uppercase hover:bg-[#2C2420] hover:text-white transition-colors duration-300 rounded-md"
            >
              Ver catálogo completo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Novedades({ tagSecciones }: Props) {
  // Si no hay datos de Supabase, usar el fallback editorial
  const secciones: TagSeccion[] =
    tagSecciones.length > 0
      ? tagSecciones
      : [{ tag: FALLBACK_TAG, productos: FALLBACK_PRODUCTOS }];

  // Filtrar secciones sin productos para no mostrar bloques vacíos
  const seccionesConProductos = secciones.filter((s) => s.productos.length > 0);

  if (seccionesConProductos.length === 0) return null;

  return (
    <div id="novedades" className="bg-ivory-soft/40 divide-y divide-[#E8DDD0]">
      {seccionesConProductos.map((seccion) => (
        <TagSection key={seccion.tag.id} tag={seccion.tag} productos={seccion.productos} />
      ))}
    </div>
  );
}
