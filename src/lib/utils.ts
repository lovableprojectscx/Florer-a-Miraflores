import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks
    .replace(/ñ/g, "n")
    .replace(/\s+/g, "-") // replace spaces with -
    .replace(/[^\w-]+/g, "") // remove all non-word chars except hyphen
    .replace(/--+/g, "-") // replace multiple - with single -
    .replace(/^-+/, "") // trim - from start
    .replace(/-+$/, ""); // trim - from end
}

export function extractIdFromSlug(slug: string): string {
  // If it's a UUID, return it directly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(slug)) {
    return slug;
  }

  // If it ends with a UUID (separated by a hyphen)
  const uuidSuffixRegex = /-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
  const match = slug.match(uuidSuffixRegex);
  if (match) {
    return match[1];
  }

  // Fallback: search for local product IDs
  const localIds = [
    "box-romantico",
    "velvet-box",
    "aurora",
    "pampas-nacimiento",
    "ramo-primavera",
    "arreglo-especial",
    "box-sorpresa",
  ];
  for (const localId of localIds) {
    if (slug === localId || slug.endsWith("-" + localId)) {
      return localId;
    }
  }

  return slug;
}

/**
 * Normaliza y enriquece descripciones de productos para renderizado Markdown:
 * - Convierte viñetas unicode (•, ·, ⁃, ▪, ▫) al inicio de línea en guiones Markdown "- "
 * - Añade doble espacio al final de líneas normales para respetar saltos de línea suaves
 * - Respeta párrafos vacíos y listas nativas
 */
export function formatProductMarkdown(text: string | null | undefined): string {
  if (!text) return "";

  const normalized = text.replace(/\r\n/g, "\n");

  return normalized
    .split("\n")
    .map((rawLine) => {
      // Convertir viñetas unicode o guiones largos al inicio en "- "
      const line = rawLine.replace(/^[\t ]*[•·⁃▪▫–—]\s*/, "- ");

      // Si es un item de lista (- o * o 1.), dejarlo tal cual para que forme <ul> / <ol>
      if (/^[\t ]*([*\-+]|\d+\.)\s/.test(line)) {
        return line;
      }

      // Si la línea está vacía, dejarla vacía (para separar párrafos limpios)
      if (line.trim() === "") {
        return "";
      }

      // Línea de texto normal: agregar dos espacios al final para respetar salto de línea simple
      return line + "  ";
    })
    .join("\n");
}

/**
 * Remueve formato Markdown para meta tags SEO (og:description, etc.)
 */
export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/^[\t ]*[•·⁃▪▫–—*\-+]\s*/gm, "")
    .replace(/[*_~`#]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Serializa datos JSON-LD escapando caracteres HTML críticos (<, >, &)
 * para prevenir cualquier inyección XSS en bloques <script type="application/ld+json">.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
