import type { TagRow } from "@/types/database";

/**
 * Mapeo canónico de alias para soportar tags históricos o renombrados en la base de datos
 * (ej: globos_para_enamorar <-> flores_y_globos_para_sorprender <-> globos).
 */
const TAG_ALIASES: Record<string, string[]> = {
  globos_para_enamorar: ["globos_para_enamorar", "flores_y_globos_para_sorprender", "globos"],
  flores_y_globos_para_sorprender: ["globos_para_enamorar", "flores_y_globos_para_sorprender", "globos"],
  globos: ["globos_para_enamorar", "flores_y_globos_para_sorprender", "globos"],
};

/**
 * Normaliza cualquier clave o alias de tag a su conjunto de claves equivalentes.
 */
export function resolverClavesTag(clave: string): string[] {
  const c = clave.toLowerCase().trim();
  if (TAG_ALIASES[c]) {
    return TAG_ALIASES[c];
  }
  if (c.includes("globo") || c.includes("balon")) {
    return ["globos_para_enamorar", "flores_y_globos_para_sorprender", "globos", c];
  }
  return [clave];
}

/**
 * Encuentra el TagRow correspondiente a una clave de tag dada, resolviendo alias históricos si es necesario.
 */
export function findTagByClave(
  tags: TagRow[] | undefined | null,
  clave: string | undefined | null
): TagRow | undefined {
  if (!tags || !clave) return undefined;

  // 1. Coincidencia exacta por clave
  const exact = tags.find((t) => t.clave === clave);
  if (exact) return exact;

  // 2. Coincidencia por alias
  const equivalentes = resolverClavesTag(clave);
  const byAlias = tags.find((t) => equivalentes.includes(t.clave));
  if (byAlias) return byAlias;

  // 3. Coincidencia parcial o por nombre
  const claveNorm = clave.toLowerCase().replace(/_/g, " ");
  return tags.find(
    (t) =>
      t.nombre.toLowerCase() === claveNorm ||
      t.clave.toLowerCase().includes(clave.toLowerCase())
  );
}

/**
 * Obtiene la información visual (label y color_badge) para mostrar la insignia (badge) de un tag.
 */
export function getTagBadgeInfo(
  tags: TagRow[] | undefined | null,
  rawTag: string | undefined | null
): { label: string; color: string; tagObj?: TagRow } | null {
  if (!rawTag) return null;

  const tagObj = findTagByClave(tags, rawTag);
  if (tagObj) {
    return {
      label: tagObj.nombre.toUpperCase(),
      color: tagObj.color_badge || "#2C2420",
      tagObj,
    };
  }

  // Fallback si no está en la tabla de tags
  const cleanLabel = rawTag.replace(/_/g, " ").toUpperCase();
  return {
    label: cleanLabel,
    color: "#2C2420",
    tagObj: undefined,
  };
}
