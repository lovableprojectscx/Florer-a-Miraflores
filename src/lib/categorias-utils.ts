import type { CategoriaRow } from "@/types/database";

export interface CategoriaSelectOption {
  id: string;
  label: string;
  activo: boolean;
  esPadre: boolean;
}

export interface CategoriaSelectGroup {
  groupLabel: string;
  options: CategoriaSelectOption[];
}

export type CategoriaRedirectTarget =
  | { to: "/categoria/$slug"; params: { slug: string }; url: string }
  | { to: "/categoria/$slug/$sub"; params: { slug: string; sub: string }; url: string };

/**
 * Filtra las categorías visibles en la web pública según la regla de negocio:
 * - Una categoría inactiva (`!activo`) nunca es visible.
 * - Una categoría padre (`parent_id === null`) es visible si tiene ≥1 producto activo directo
 *   O si tiene al menos una hija activa con ≥1 producto activo directo.
 * - Una subcategoría (`parent_id !== null`) es visible SOLO si su padre está activo Y ella
 *   misma tiene ≥1 producto activo directo (una hija vacía se oculta aunque su padre tenga productos).
 */
export function filtrarCategoriasVisibles(
  categorias: CategoriaRow[],
  idsConProductos: Iterable<string | null | undefined>,
): CategoriaRow[] {
  if (categorias.length === 0) return [];

  const idsConProdSet = new Set<string>();
  for (const id of idsConProductos) {
    if (id) idsConProdSet.add(id);
  }

  const padresActivos = new Map<string, CategoriaRow>();
  for (const c of categorias) {
    if (c.activo && !c.parent_id) {
      padresActivos.set(c.id, c);
    }
  }

  // Determinar qué padres tienen al menos una hija activa con ≥1 producto activo
  const padresConHijaConProductos = new Set<string>();
  for (const c of categorias) {
    if (c.activo && c.parent_id && padresActivos.has(c.parent_id) && idsConProdSet.has(c.id)) {
      padresConHijaConProductos.add(c.parent_id);
    }
  }

  return categorias.filter((c) => {
    if (!c.activo) return false;

    if (!c.parent_id) {
      return idsConProdSet.has(c.id) || padresConHijaConProductos.has(c.id);
    }

    // Subcategoría: padre debe existir y estar activo, y la subcategoría debe tener ≥1 producto activo
    if (!padresActivos.has(c.parent_id)) return false;
    return idsConProdSet.has(c.id);
  });
}

/**
 * Calcula para cada categoría cuántos productos activos tiene asignados directamente,
 * cuántos suman sus subcategorías hijas y el total combinado.
 */
export function calcularConteoProductosPorCategoria(
  categorias: CategoriaRow[],
  categoriaIdsDeProductosActivos: Iterable<string | null | undefined>,
): Record<string, { directos: number; hijas: number; total: number }> {
  const directosPorId = new Map<string, number>();
  for (const catId of categoriaIdsDeProductosActivos) {
    if (catId) {
      directosPorId.set(catId, (directosPorId.get(catId) ?? 0) + 1);
    }
  }

  const resultado: Record<string, { directos: number; hijas: number; total: number }> = {};

  for (const cat of categorias) {
    const directos = directosPorId.get(cat.id) ?? 0;
    if (!cat.parent_id) {
      const hijasCount = categorias
        .filter((h) => h.parent_id === cat.id)
        .reduce((acc, h) => acc + (directosPorId.get(h.id) ?? 0), 0);
      resultado[cat.id] = {
        directos,
        hijas: hijasCount,
        total: directos + hijasCount,
      };
    } else {
      resultado[cat.id] = {
        directos,
        hijas: 0,
        total: directos,
      };
    }
  }

  return resultado;
}

/**
 * Arma las opciones agrupadas para el <select> de categoría en el panel Admin.
 * - Las categorías padre sin hijas aparecen bajo el grupo "Categorías Principales".
 * - Cada categoría padre con hijas genera un <optgroup label="Padre">, incluyendo la opción
 *   del propio padre ("Padre (Principal)") y sus hijas como "Padre › Hija".
 * - Las categorías inactivas (o hijas de un padre inactivo) se marcan con "(inactiva)".
 */
export function armarOpcionesCategoriaSelect(categorias: CategoriaRow[]): CategoriaSelectGroup[] {
  if (categorias.length === 0) return [];

  const sortByOrden = (a: CategoriaRow, b: CategoriaRow) =>
    (a.orden ?? 0) - (b.orden ?? 0) || a.nombre.localeCompare(b.nombre, "es");

  const padres = categorias.filter((c) => !c.parent_id).sort(sortByOrden);
  const hijas = categorias.filter((c) => !!c.parent_id).sort(sortByOrden);
  const padresIds = new Set(padres.map((p) => p.id));

  const padresSinHijas = padres.filter((p) => !hijas.some((h) => h.parent_id === p.id));
  const padresConHijas = padres.filter((p) => hijas.some((h) => h.parent_id === p.id));

  const grupos: CategoriaSelectGroup[] = [];

  if (padresSinHijas.length > 0) {
    grupos.push({
      groupLabel: "Categorías Principales",
      options: padresSinHijas.map((p) => ({
        id: p.id,
        label: `${p.nombre}${!p.activo ? " (inactiva)" : ""}`,
        activo: p.activo,
        esPadre: true,
      })),
    });
  }

  for (const padre of padresConHijas) {
    const hijasDePadre = hijas.filter((h) => h.parent_id === padre.id);
    const padreInactivo = !padre.activo;

    const options: CategoriaSelectOption[] = [
      {
        id: padre.id,
        label: `${padre.nombre} (Principal)${padreInactivo ? " (inactiva)" : ""}`,
        activo: padre.activo,
        esPadre: true,
      },
      ...hijasDePadre.map((h) => {
        const inactiva = !h.activo || padreInactivo;
        return {
          id: h.id,
          label: `${padre.nombre} › ${h.nombre}${inactiva ? " (inactiva)" : ""}`,
          activo: !inactiva,
          esPadre: false,
        };
      }),
    ];

    grupos.push({
      groupLabel: `${padre.nombre}${padreInactivo ? " (inactiva)" : ""}`,
      options,
    });
  }

  const huerfanas = hijas.filter((h) => h.parent_id && !padresIds.has(h.parent_id));
  if (huerfanas.length > 0) {
    grupos.push({
      groupLabel: "Subcategorías sin padre",
      options: huerfanas.map((h) => ({
        id: h.id,
        label: `Huérfana › ${h.nombre}${!h.activo ? " (inactiva)" : ""}`,
        activo: h.activo,
        esPadre: false,
      })),
    });
  }

  return grupos;
}

/**
 * Busca si el `slug` ya existe en la lista de categorías cargadas en memoria
 * (ignorando `ignorarId` cuando se está editando una categoría existente).
 * Devuelve el mensaje descriptivo listo para mostrar al usuario, o `null` si no hay conflicto.
 */
export function buscarConflictoSlugCategoria(
  slug: string,
  categorias: CategoriaRow[],
  ignorarId?: string,
): string | null {
  const cleanSlug = slug.trim().toLowerCase();
  if (!cleanSlug) return null;

  const existente = categorias.find(
    (c) => c.slug.trim().toLowerCase() === cleanSlug && c.id !== ignorarId,
  );
  if (!existente) return null;

  const padre = existente.parent_id
    ? categorias.find((p) => p.id === existente.parent_id)
    : undefined;
  const ubicacion = padre ? `${padre.nombre} › ${existente.nombre}` : existente.nombre;
  const base = `Ya existe una categoría con el slug «${cleanSlug}» (está en: ${ubicacion})`;

  if (!existente.activo) {
    return `${base} — está inactiva: actívala en vez de crear otra.`;
  }
  return `${base}.`;
}

/**
 * Mapea un error de Supabase (como `23505` duplicate key) al mensaje legible para toast.
 */
export function formatearErrorGuardadoCategoria(
  error: { code?: string; message?: string } | null | undefined,
  slugIntentado: string,
  categorias: CategoriaRow[],
  ignorarId?: string,
): string {
  const isDuplicate =
    error?.code === "23505" || /duplicate key|unique constraint|23505/i.test(error?.message ?? "");

  if (isDuplicate) {
    const detalle = buscarConflictoSlugCategoria(slugIntentado, categorias, ignorarId);
    if (detalle) return detalle;
    return `Ya existe una categoría con el slug «${slugIntentado.trim().toLowerCase()}».`;
  }

  return error?.message
    ? `Error al guardar la categoría: ${error.message}`
    : "Error al guardar la categoría.";
}

/**
 * Resuelve si una ruta `/categoria/:parentSlug/:subSlug` donde `:subSlug` no es hija de `:parentSlug`
 * corresponde a una categoría activa que ahora es padre (`/categoria/:subSlug`) o hija de otro padre
 * (`/categoria/:otroPadre/:subSlug`).
 * Devuelve `null` si `:subSlug` ya es hija válida de `:parentSlug` o si no existe/está inactiva.
 */
export function resolverRedireccionSubcategoria(
  parentSlug: string,
  subSlug: string,
  categorias: CategoriaRow[],
): CategoriaRedirectTarget | null {
  const activas = categorias.filter((c) => c.activo);
  const padreActual = activas.find((c) => c.slug === parentSlug);
  const candidata = activas.find((c) => c.slug === subSlug);

  if (!candidata) return null;

  // Si ya es hija directa del padre indicado en la URL, no hay redirección
  if (padreActual && candidata.parent_id === padreActual.id) {
    return null;
  }

  // Si la categoría con ese slug es ahora una categoría padre (parent_id === null)
  if (!candidata.parent_id) {
    return {
      to: "/categoria/$slug",
      params: { slug: candidata.slug },
      url: `/categoria/${candidata.slug}`,
    };
  }

  // Si es hija de otro padre activo distinto al de la URL
  const verdaderoPadre = activas.find((c) => c.id === candidata.parent_id);
  if (verdaderoPadre) {
    return {
      to: "/categoria/$slug/$sub",
      params: { slug: verdaderoPadre.slug, sub: candidata.slug },
      url: `/categoria/${verdaderoPadre.slug}/${candidata.slug}`,
    };
  }

  return null;
}
