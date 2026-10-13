import { useCallback, useMemo, useState } from "react";

export interface UseVerMasResult<T> {
  visibles: T[];
  total: number;
  mostrando: number;
  hayMas: boolean;
  verMas: () => void;
}

function construirClaveEstable<T>(items: T[], tamanoLote: number): string {
  const partes = items.map((item, idx) => {
    if (item !== null && typeof item === "object") {
      if ("id" in item && (item as { id?: unknown }).id != null) {
        return String((item as { id?: unknown }).id);
      }
      if ("name" in item && (item as { name?: unknown }).name != null) {
        return String((item as { name?: unknown }).name);
      }
    }
    return `${idx}:${String(item)}`;
  });
  return `${tamanoLote}|${items.length}|${partes.join(",")}`;
}

/**
 * Paginación incremental en cliente ("Ver más") por lotes.
 * Se reinicia automáticamente al tamaño de lote inicial cuando cambia el
 * contenido u orden de la lista (comparado por clave estable de IDs + longitud,
 * no por referencia del array).
 */
export function useVerMas<T>(items: T[], tamanoLote = 24): UseVerMasResult<T> {
  const lote = tamanoLote > 0 ? tamanoLote : 24;
  const claveActual = useMemo(() => construirClaveEstable(items, lote), [items, lote]);

  const [estado, setEstado] = useState<{ clave: string; limite: number }>(() => ({
    clave: claveActual,
    limite: lote,
  }));

  const limiteVigente = estado.clave === claveActual ? estado.limite : lote;
  const total = items.length;
  const mostrando = Math.min(limiteVigente, total);

  const visibles = useMemo(() => items.slice(0, mostrando), [items, mostrando]);
  const hayMas = mostrando < total;

  const verMas = useCallback(() => {
    setEstado((prev) => {
      const base = prev.clave === claveActual ? prev.limite : lote;
      return {
        clave: claveActual,
        limite: Math.min(base + lote, total),
      };
    });
  }, [claveActual, lote, total]);

  return {
    visibles,
    total,
    mostrando,
    hayMas,
    verMas,
  };
}
