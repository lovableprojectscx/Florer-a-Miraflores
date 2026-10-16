import type { TestimonioFuente } from "@/types/database";

export interface TestimonioFormInput {
  nombre: string;
  texto: string;
  estrellas: number;
  fecha?: string | null;
  fuente?: TestimonioFuente;
  enlace_original?: string | null;
  imagen_url?: string | null;
  destacado?: boolean;
  orden?: number;
  activo?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    nombre?: string;
    texto?: string;
    estrellas?: string;
    fuente?: string;
  };
}

/**
 * Valida los datos del formulario de testimonios.
 * Reglas según Prompt 07:
 * - Nombre obligatorio (no vacío).
 * - Texto obligatorio, mínimo 10 caracteres.
 * - Estrellas entre 1 y 5 (entero).
 * - Fuente válida: 'google' | 'whatsapp' | 'facebook' | 'directo'.
 */
export function validateTestimonioForm(input: Partial<TestimonioFormInput>): ValidationResult {
  const errors: ValidationResult["errors"] = {};

  const nombre = input.nombre?.trim() ?? "";
  if (!nombre) {
    errors.nombre = "El nombre es obligatorio.";
  }

  const texto = input.texto?.trim() ?? "";
  if (!texto) {
    errors.texto = "El texto de la reseña es obligatorio.";
  } else if (texto.length < 10) {
    errors.texto = "El texto de la reseña debe tener al menos 10 caracteres.";
  }

  const estrellas = input.estrellas;
  if (
    estrellas === undefined ||
    estrellas === null ||
    !Number.isInteger(estrellas) ||
    estrellas < 1 ||
    estrellas > 5
  ) {
    errors.estrellas = "La calificación debe ser un número entero entre 1 y 5 estrellas.";
  }

  const fuentesValidas: TestimonioFuente[] = ["google", "whatsapp", "facebook", "directo"];
  if (input.fuente && !fuentesValidas.includes(input.fuente)) {
    errors.fuente = "La fuente debe ser google, whatsapp, facebook o directo.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Formatea una calificación numérica con coma decimal (ej. 4.9 -> "4,9").
 * Si el valor no es un número válido, devuelve "0,0".
 */
export function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined || Number.isNaN(Number(rating))) {
    return "0,0";
  }
  const num = Number(rating);
  const rounded = (Math.round((num + Number.EPSILON) * 10) / 10).toFixed(1);
  return rounded.replace(".", ",");
}

/**
 * Determina si debe mostrarse la franja de testimonios en el Home.
 * Regla: solo si mostrar_resenas_home = true Y hay al menos 3 reseñas activas.
 */
export function shouldShowHomeTestimonios(
  mostrarHome: boolean | null | undefined,
  countActivos: number,
): boolean {
  return Boolean(mostrarHome) && countActivos >= 3;
}

/**
 * Formatea el texto de resumen de Google:
 * "★ 4,9 · 120 reseñas en Google"
 * Devuelve null si no están presentes o son inválidos rating o count.
 */
export function formatGoogleSummary(
  rating: number | null | undefined,
  count: number | null | undefined,
): string | null {
  if (
    rating === null ||
    rating === undefined ||
    count === null ||
    count === undefined ||
    count <= 0 ||
    Number.isNaN(Number(rating))
  ) {
    return null;
  }
  const formattedRating = formatRating(rating);
  const countStr = count.toLocaleString("es-PE");
  return `★ ${formattedRating} · ${countStr} ${count === 1 ? "reseña" : "reseñas"} en Google`;
}

/**
 * Formatea la fecha de un testimonio mostrando solo "mes año" (ej. "ago. 2026")
 * o el texto relativo original si no es una fecha numérica.
 * Regla estricta: NUNCA muestra un día exacto para evitar datos inventados
 * procedentes de aproximaciones (como el día 15 de cada mes).
 */
export function formatTestimonioFecha(fecha: string | null | undefined): string | null {
  if (!fecha || typeof fecha !== "string") return null;
  const trimmed = fecha.trim();
  if (!trimmed) return null;

  // Si tiene formato YYYY-MM-DD o YYYY-MM
  const match = trimmed.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  if (match) {
    const anio = Number(match[1]);
    const mes = Number(match[2]);
    if (mes >= 1 && mes <= 12) {
      const d = new Date(anio, mes - 1, 1);
      return d.toLocaleDateString("es-PE", {
        month: "short",
        year: "numeric",
      });
    }
  }

  // Si es fecha ISO completa YYYY-MM-DDTHH:mm:ss...
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    try {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("es-PE", {
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      // Retornar fallback trimmed
    }
  }

  // Texto relativo (ej: "hace 2 meses", "hace un año") o libre: devolver intacto
  return trimmed;
}
