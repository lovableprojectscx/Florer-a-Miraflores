import type { RecuerdoInsert, RecuerdoRow } from "@/types/database";

/**
 * Convierte un texto con tildes, eñes y caracteres especiales
 * en un slug limpio y amigable para URLs y SEO de recuerdos.
 * Ej: "Sorpresa de Aniversario en Miraflores" -> "sorpresa-de-aniversario-en-miraflores"
 */
export function slugifyRecuerdo(text: string): string {
  if (!text) return "";

  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Regla de visibilidad pública:
 * Un recuerdo solo es visible si está publicado y su fecha de publicación es menor o igual a la actual.
 */
export function isRecuerdoVisible(
  recuerdo: Pick<RecuerdoRow, "publicado" | "fecha_publicacion">,
  now: Date = new Date(),
): boolean {
  if (!recuerdo.publicado || !recuerdo.fecha_publicacion) return false;
  const fecha = new Date(recuerdo.fecha_publicacion);
  return !isNaN(fecha.getTime()) && fecha.getTime() <= now.getTime();
}

/**
 * Determina el estado de un recuerdo para el panel administrativo.
 */
export function getRecuerdoStatus(
  recuerdo: Pick<RecuerdoRow, "publicado" | "fecha_publicacion">,
  now: Date = new Date(),
): "publicado" | "programado" | "borrador" {
  if (!recuerdo.publicado) return "borrador";
  if (!recuerdo.fecha_publicacion) return "borrador";
  const fecha = new Date(recuerdo.fecha_publicacion);
  if (isNaN(fecha.getTime())) return "borrador";
  return fecha.getTime() <= now.getTime() ? "publicado" : "programado";
}

/**
 * Formato de fecha editorial amigable en español (ej: "15 de octubre de 2026").
 */
export function formatRecuerdoDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

export interface ValidacionRecuerdoResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validación pura para el formulario de creación y edición de recuerdos de entrega.
 */
export function validarRecuerdoForm(
  data: Partial<RecuerdoInsert> & { id?: string },
): ValidacionRecuerdoResult {
  const errors: Record<string, string> = {};

  const titulo = data.titulo?.trim() ?? "";
  if (!titulo) {
    errors.titulo = "El título del recuerdo es obligatorio.";
  } else if (titulo.length > 200) {
    errors.titulo = "El título no debe superar los 200 caracteres.";
  }

  const slug = data.slug?.trim() ?? "";
  if (!slug) {
    errors.slug = "El slug es obligatorio.";
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug =
      "El slug solo puede contener letras minúsculas, números y guiones (sin guiones al inicio o final).";
  }

  const contenido = data.contenido?.trim() ?? "";
  if (!contenido) {
    errors.contenido = "La reseña o historia breve del recuerdo no puede estar vacía.";
  } else if (contenido.length < 5) {
    errors.contenido = "La historia debe tener al menos 5 caracteres.";
  }

  if (data.resumen && data.resumen.length > 300) {
    errors.resumen = "La frase corta no debe superar los 300 caracteres.";
  }

  if (data.meta_title && data.meta_title.length > 100) {
    errors.meta_title = "El meta título SEO no debe superar los 100 caracteres.";
  }

  if (data.meta_description && data.meta_description.length > 200) {
    errors.meta_description = "La meta descripción SEO no debe superar los 200 caracteres.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Genera el mensaje estructurado de WhatsApp para pedir el mismo arreglo de un recuerdo.
 */
export function construirMensajeWhatsAppRecuerdo({
  titulo,
  slug,
  siteUrl = "https://floreriamiraflores.com",
}: {
  titulo: string;
  slug: string;
  siteUrl?: string;
}): string {
  const url = `${siteUrl.replace(/\/$/, "")}/recuerdos/${slug}`;
  return `Hola Florería Miraflores, vi la entrega "${titulo}" (${url}) y quisiera encargar el mismo arreglo floral.`;
}

/**
 * Genera el objeto JSON-LD para Schema.org tipo `Article` / `SocialMediaPosting`
 * enfocado en entregas y momentos locales en Lima.
 */
export function generateRecuerdoSchema({
  recuerdo,
  siteUrl = "https://floreriamiraflores.com",
}: {
  recuerdo: RecuerdoRow;
  siteUrl?: string;
}) {
  const url = `${siteUrl.replace(/\/$/, "")}/recuerdos/${recuerdo.slug}`;
  const imageUrl = recuerdo.imagen_portada_url || `${siteUrl}/brand/logo.png`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: recuerdo.meta_title || recuerdo.titulo,
    description: recuerdo.meta_description || recuerdo.resumen || recuerdo.titulo,
    image: [imageUrl],
    datePublished: recuerdo.fecha_publicacion || recuerdo.created_at,
    dateModified: recuerdo.updated_at || recuerdo.created_at,
    author: {
      "@type": "Organization",
      name: recuerdo.autor || "Florería Miraflores",
      url: siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Florería Miraflores",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/brand/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
