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
    .replace(/[^\w\-]+/g, "") // remove all non-word chars except hyphen
    .replace(/\-\-+/g, "-") // replace multiple - with single -
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
