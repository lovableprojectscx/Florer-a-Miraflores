import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Product } from "@/data/catalog";
import type { ProductoRow } from "@/types/database";

/**
 * Filtros de catálogo — orden y rango de precio.
 * Se usa en: /catalogo, /categoria/:slug, /categoria/:slug/:sub y /tag/:key.
 */

type Producto = Product | ProductoRow;

export type OrdenProductos = "recomendados" | "precio_asc" | "precio_desc";

export const ORDEN_OPCIONES: { value: OrdenProductos; label: string }[] = [
  { value: "recomendados", label: "Recomendados" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
];

export const RANGOS_PRECIO = [
  { value: "todos", label: "Todos los precios", min: 0, max: null },
  { value: "0-100", label: "Hasta S/ 100", min: 0, max: 100 },
  { value: "100-200", label: "S/ 100 — S/ 200", min: 100, max: 200 },
  { value: "200-300", label: "S/ 200 — S/ 300", min: 200, max: 300 },
  { value: "300+", label: "Más de S/ 300", min: 300, max: null },
] as const;

export type RangoPrecioValue = (typeof RANGOS_PRECIO)[number]["value"];

/** Hook: aplica rango de precio y orden sobre una lista de productos. */
export function useProductFilters<T extends Producto>(productos: T[]) {
  const [orden, setOrden] = useState<OrdenProductos>("recomendados");
  const [rango, setRango] = useState<RangoPrecioValue>("todos");

  const filtrados = useMemo(() => {
    const r = RANGOS_PRECIO.find((x) => x.value === rango) ?? RANGOS_PRECIO[0];
    let out = productos.filter((p) => p.precio >= r.min && (r.max === null || p.precio <= r.max));
    if (orden === "precio_asc") out = [...out].sort((a, b) => a.precio - b.precio);
    else if (orden === "precio_desc") out = [...out].sort((a, b) => b.precio - a.precio);
    return out;
  }, [productos, orden, rango]);

  return { filtrados, orden, setOrden, rango, setRango };
}

/** Select estilizado según la identidad visual del sitio. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="text-[10px] tracking-widest uppercase font-body font-light text-[#8A7A6E]">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full sm:w-auto h-10 pl-3 pr-9 bg-white border border-[#E8DDD0] font-body text-sm text-[#2C2420] outline-none focus:border-[#C4956A] transition-colors duration-200 appearance-none cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7A6E] pointer-events-none"
          strokeWidth={1.5}
        />
      </span>
    </label>
  );
}

interface ProductFiltersBarProps {
  /** Cantidad de productos visibles tras aplicar filtros */
  total: number;
  orden: OrdenProductos;
  onOrdenChange: (orden: OrdenProductos) => void;
  rango: RangoPrecioValue;
  onRangoChange: (rango: RangoPrecioValue) => void;
  /** Selects adicionales (ej. categoría / ocasión en /catalogo) */
  children?: React.ReactNode;
}

/** Barra de filtros: contador de resultados + selects. */
export function ProductFiltersBar({
  total,
  orden,
  onOrdenChange,
  rango,
  onRangoChange,
  children,
}: ProductFiltersBarProps) {
  return (
    <div className="mb-8 md:mb-10 border-y border-[#E8DDD0] py-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <p className="font-body font-light text-sm text-[#8A7A6E] sm:pb-2.5">
        {total} producto{total !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:gap-4">
        {children}
        <FilterSelect
          label="Precio"
          value={rango}
          onChange={(v) => onRangoChange(v as RangoPrecioValue)}
          options={RANGOS_PRECIO.map((r) => ({ value: r.value, label: r.label }))}
        />
        <FilterSelect
          label="Ordenar por"
          value={orden}
          onChange={(v) => onOrdenChange(v as OrdenProductos)}
          options={ORDEN_OPCIONES}
        />
      </div>
    </div>
  );
}
