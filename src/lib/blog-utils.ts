import type { BlogPostInsert, BlogPostRow } from "@/types/database";

/**
 * Convierte un texto con tildes, eñes, mayúsculas y caracteres especiales
 * en un slug limpio y amigable para URLs y SEO.
 * Ej: "Qué flores regalar en un aniversario" -> "que-flores-regalar-en-un-aniversario"
 */
export function slugifyBlog(text: string): string {
  if (!text) return "";

  return text
    .toString()
    .normalize("NFD") // Descompone caracteres acentuados (ej: é -> e + ´)
    .replace(/[\u0300-\u036f]/g, "") // Elimina marcas diacríticas
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Elimina símbolos y signos de puntuación (¿, ?, ¡, !, :, etc.)
    .replace(/[\s_-]+/g, "-") // Reemplaza espacios y guiones bajos por un solo guion
    .replace(/^-+|-+$/g, ""); // Remueve guiones al inicio o al final
}

/**
 * Regla de visibilidad pública:
 * Un artículo solo es visible si está publicado y su fecha de publicación es menor o igual a la actual.
 */
export function isBlogPostVisible(
  post: Pick<BlogPostRow, "publicado" | "fecha_publicacion">,
  now: Date = new Date(),
): boolean {
  if (!post.publicado || !post.fecha_publicacion) return false;
  const fecha = new Date(post.fecha_publicacion);
  return !isNaN(fecha.getTime()) && fecha.getTime() <= now.getTime();
}

/**
 * Determina el estado de un artículo para el panel administrativo.
 */
export function getBlogPostStatus(
  post: Pick<BlogPostRow, "publicado" | "fecha_publicacion">,
  now: Date = new Date(),
): "publicado" | "programado" | "borrador" {
  if (!post.publicado) return "borrador";
  if (!post.fecha_publicacion) return "borrador";
  const fecha = new Date(post.fecha_publicacion);
  if (isNaN(fecha.getTime())) return "borrador";
  return fecha.getTime() <= now.getTime() ? "publicado" : "programado";
}

/**
 * Formato de fecha editorial amigable en español (ej: "14 de octubre de 2026").
 */
export function formatBlogDate(dateStr: string | null | undefined): string {
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

/**
 * Calcula el tiempo estimado de lectura en minutos basado en ~200 palabras por minuto.
 */
export function calculateReadingTime(content: string): number {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export interface ValidacionBlogResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validación pura para el formulario de creación y edición de artículos.
 */
export function validarBlogPostForm(
  data: Partial<BlogPostInsert> & { id?: string },
): ValidacionBlogResult {
  const errors: Record<string, string> = {};

  const titulo = data.titulo?.trim() ?? "";
  if (!titulo) {
    errors.titulo = "El título es obligatorio.";
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
    errors.contenido = "El contenido del artículo no puede estar vacío.";
  } else if (contenido.length < 10) {
    errors.contenido = "El contenido debe tener al menos 10 caracteres.";
  }

  if (data.resumen && data.resumen.length > 300) {
    errors.resumen = "El resumen no debe superar los 300 caracteres (óptimo: ~160 para SEO).";
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
 * Genera el objeto JSON-LD para el esquema `BlogPosting` según Schema.org.
 */
export function generateBlogPostingSchema({
  post,
  siteUrl = "https://floreriamiraflores.com",
}: {
  post: BlogPostRow;
  siteUrl?: string;
}) {
  const url = `${siteUrl.replace(/\/$/, "")}/blog/${post.slug}`;
  const imageUrl = post.imagen_portada_url || `${siteUrl}/brand/logo.png`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.meta_title || post.titulo,
    description: post.meta_description || post.resumen || post.titulo,
    image: [imageUrl],
    datePublished: post.fecha_publicacion || post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: {
      "@type": "Organization",
      name: post.autor || "Florería Miraflores",
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
