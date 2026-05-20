import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import type { ProductoRow, TagRow } from "@/types/database";

import pampas from "@/assets/product-novedad-pampas.jpg";
import velvet from "@/assets/product-novedad-velvet.jpg";
import aurora from "@/assets/product-novedad-aurora.jpg";

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
}: {
  producto: ProductoRow;
  badgeLabel: string;
  badgeColor: string;
}) {
  const { agregarItem, abrirCarrito } = useCartStore();
  const imgSrc = producto.imagenes?.[0] ?? "";

  return (
    <article className="group flex flex-col w-full max-w-[290px] mx-auto md:mx-0">
      <Link to="/producto/$id" params={{ id: producto.id }} className="block">
        <div className="relative overflow-hidden bg-ivory" style={{ aspectRatio: "3/4" }}>
          {/* Badge del tag */}
          <span
            className="absolute top-3 left-3 z-10 text-white text-[9px] tracking-[0.18em] uppercase font-body font-light px-3 py-1.5 leading-none"
            style={{ backgroundColor: badgeColor }}
          >
            {badgeLabel}
          </span>

          <img
            src={imgSrc}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
          />
        </div>

        <div className="mt-4 flex-1 flex flex-col">
          <p className="font-display text-foreground text-lg md:text-2xl leading-tight">
            {producto.nombre}
          </p>
          {producto.descripcion && (
            <p className="mt-1 font-body font-light text-foreground/60 text-sm line-clamp-2">
              {producto.descripcion}
            </p>
          )}
          <p className="mt-2 font-body font-medium text-foreground text-sm">
            S/ {producto.precio.toFixed(2)}
          </p>
        </div>
      </Link>

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
        className="mt-3 w-full h-10 border border-foreground text-foreground font-body text-[10px] tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors duration-200"
      >
        Agregar al carrito
      </button>
    </article>
  );
}

// ─── Subcomponente: Sección de un tag ────────────────────────────────────────

function TagSection({ tag, productos }: TagSeccion) {
  const hayMas = productos.length > 4;
  const visibles = productos.slice(0, 4);

  return (
    <section
      id={`tag-${tag.clave}`}
      className="px-5 md:px-10 lg:px-16 py-14 md:py-24"
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
          {hayMas && (
            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-2 font-body text-xs tracking-widest uppercase text-foreground/60 hover:text-foreground border-b border-foreground/20 hover:border-foreground/60 pb-0.5 transition-colors group flex-shrink-0"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-10 md:gap-y-16">
          {visibles.map((p) => (
            <ProductCard
              key={p.id}
              producto={p}
              badgeLabel={tag.nombre}
              badgeColor={tag.color_badge}
            />
          ))}
        </div>

        {/* Botón "Ver todos" — solo mobile, si hay más de 4 */}
        {hayMas && (
          <div className="mt-10 flex justify-center md:hidden">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 border border-foreground/30 text-foreground font-body text-[10px] tracking-widest uppercase hover:bg-foreground hover:text-background transition-colors"
            >
              Ver todos los {tag.nombre.toLowerCase()}
              <ArrowRight className="h-3.5 w-3.5" />
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
