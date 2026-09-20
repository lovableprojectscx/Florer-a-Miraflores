import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ProductoRow, TagRow } from "@/types/database";
import { slugify } from "@/lib/utils";

import pampas from "@/assets/product-novedad-pampas.webp";
import velvet from "@/assets/product-novedad-velvet.webp";
import aurora from "@/assets/product-novedad-aurora.webp";

// ─── Fallback cuando no hay datos en Supabase ────────────────────────────────

const FALLBACK_TAG: TagRow = {
  id: "fallback",
  clave: "novedad",
  nombre: "Descubre lo nuevo en tienda",
  descripcion: "Actualizamos esta selección constantemente con las flores más frescas.",
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

export interface TagSeccion {
  tag: TagRow;
  productos: ProductoRow[];
}

interface Props {
  tagSecciones: TagSeccion[];
}

// ─── Subcomponente: Card limpia estilo Lima Floral ──────────────────────────

function ProductCard({ producto }: { producto: ProductoRow }) {
  const imgSrc = producto.imagenes?.[0] ?? "";

  return (
    <article className="group flex-shrink-0 w-[145px] sm:w-[170px] md:w-[195px] lg:w-[220px] xl:w-[240px] select-none">
      <Link
        to="/producto/$id"
        params={{ id: `${slugify(producto.nombre)}-${producto.id}` }}
        className="block"
      >
        {/* Imagen cuadrada limpia sin bordes pesados */}
        <div className="relative overflow-hidden bg-[#FAF8F5] aspect-square rounded-lg">
          <img
            src={imgSrc}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
          />
        </div>

        {/* Información del producto */}
        <div className="pt-2 sm:pt-2.5 pb-1">
          <h3 className="font-body text-[#2C2420] text-xs sm:text-sm font-normal leading-snug line-clamp-1 group-hover:text-[#8A7A6E] transition-colors">
            {producto.nombre}
          </h3>
          <p className="mt-0.5 sm:mt-1 font-body font-medium text-[#2C2420] text-xs sm:text-sm">
            S/. {producto.precio.toFixed(2)} <span className="text-[9px] sm:text-[10px] font-normal text-[#8A7A6E]">PEN</span>
          </p>
        </div>
      </Link>
    </article>
  );
}

// ─── Subcomponente: Sección Slider estilo Lima Floral ────────────────────────

function TagSection({ tag, productos }: TagSeccion) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [currentIdx, setCurrentIdx] = useState(1);
  const total = productos.length;

  const updateCurrentIndex = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    if (scrollWidth <= clientWidth) {
      setCurrentIdx(1);
      return;
    }
    const maxScroll = scrollWidth - clientWidth;
    const progress = Math.min(1, Math.max(0, scrollLeft / maxScroll));
    const idx = Math.min(total, Math.max(1, Math.round(progress * (total - 1)) + 1));
    setCurrentIdx(idx);
  };

  const handlePrev = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: -sliderRef.current.clientWidth * 0.75, behavior: "smooth" });
  };

  const handleNext = () => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: sliderRef.current.clientWidth * 0.75, behavior: "smooth" });
  };

  return (
    <section id={`tag-${tag.clave}`} className="py-10 md:py-14 overflow-hidden">
      {/* Encabezado con márgenes alineados */}
      <div className="px-4 sm:px-6 md:px-12 mb-4 sm:mb-6">
        <h2 className="font-display text-[#2C2420] text-xl sm:text-2xl md:text-3xl font-normal leading-tight">
          {tag.nombre}
        </h2>
        {tag.descripcion && (
          <p className="mt-1 font-body font-light text-[#8A7A6E] text-xs sm:text-sm">
            {tag.descripcion}
          </p>
        )}
      </div>

      {/* Slider que ocupa de extremo a extremo (mostrando ~2.5 productos en móvil y ~5 en desktop) */}
      <div
        ref={sliderRef}
        onScroll={updateCurrentIndex}
        className="flex overflow-x-auto px-4 sm:px-6 md:px-12 gap-2.5 sm:gap-3.5 md:gap-4 pb-3 snap-x snap-mandatory scrollbar-none w-full"
      >
        {productos.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </div>

      {/* Controles de paginación y botón "Ver más productos" */}
      <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
        {total > 1 && (
          <div className="flex items-center gap-3 text-xs font-body text-[#8A7A6E] select-none">
            <button
              onClick={handlePrev}
              aria-label="Anterior"
              className="p-1 hover:text-[#2C2420] transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="tracking-wider">
              {currentIdx} / {total}
            </span>
            <button
              onClick={handleNext}
              aria-label="Siguiente"
              className="p-1 hover:text-[#2C2420] transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <Link
          to="/tag/$key"
          params={{ key: tag.clave }}
          className="inline-flex items-center justify-center px-7 sm:px-8 py-2.5 sm:py-3 bg-[#A7A18C] hover:bg-[#96907C] text-white text-[11px] tracking-widest uppercase font-body font-normal rounded-md transition-colors duration-300 shadow-xs"
        >
          Ver más productos
        </Link>
      </div>
    </section>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Novedades({ tagSecciones }: Props) {
  const secciones: TagSeccion[] =
    tagSecciones.length > 0
      ? tagSecciones
      : [{ tag: FALLBACK_TAG, productos: FALLBACK_PRODUCTOS }];

  const seccionesConProductos = secciones.filter((s) => s.productos.length > 0);

  if (seccionesConProductos.length === 0) return null;

  return (
    <div id="novedades" className="bg-[#FFFFFF] divide-y divide-[#E8DDD0]/50">
      {seccionesConProductos.map((seccion) => (
        <TagSection key={seccion.tag.id} tag={seccion.tag} productos={seccion.productos} />
      ))}
    </div>
  );
}
