import type { SyntheticEvent } from "react";

export type ImageWidth = 480 | 960;

const SUPABASE_STORAGE_REGEX = /(\/storage\/v1\/object\/public\/[^/]+)\/(?:thumbs\/\d+\/)?(.+)/;

/**
 * Determina si una URL pertenece a Supabase Storage (objeto público).
 */
export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  return SUPABASE_STORAGE_REGEX.test(url);
}

/**
 * Genera la URL de miniatura (480 o 960 px) para imágenes en Supabase Storage.
 * Si no es de Supabase Storage o no se especifica ancho, devuelve la URL original intacta.
 *
 * @param url URL de la imagen
 * @param ancho Ancho objetivo: 480 o 960 px
 */
export function imagenUrl(url: string | null | undefined, ancho?: ImageWidth): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!ancho) return trimmed;

  const match = trimmed.match(SUPABASE_STORAGE_REGEX);
  if (!match) {
    // Es un asset local (ej: /assets/...) o URL externa: retornar tal cual
    return trimmed;
  }

  const [, basePath, filePath] = match;
  return trimmed.replace(SUPABASE_STORAGE_REGEX, `${basePath}/thumbs/${ancho}/${filePath}`);
}

/**
 * Genera el atributo `srcset` para una imagen de Supabase Storage,
 * apuntando a las variantes de 480w y 960w.
 */
export function imagenSrcSet(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!isSupabaseStorageUrl(trimmed)) return undefined;

  const u480 = imagenUrl(trimmed, 480);
  const u960 = imagenUrl(trimmed, 960);
  return `${u480} 480w, ${u960} 960w`;
}

/**
 * Reinvierte una URL de miniatura (`thumbs/480/` o `thumbs/960/`) a la URL original.
 */
export function revertirMiniatura(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  return url.replace(/\/thumbs\/\d+\//, "/");
}

/**
 * Manejador onError para elementos <img> que intentan cargar una miniatura.
 * Si la miniatura no existe (404), cae automáticamente al original sin bucles infinitos.
 *
 * @param event Evento de error sintético de React
 * @param originalUrl URL original opcional (si no se provee, se deriva de event.currentTarget.src)
 */
export function onImageThumbError(
  event: SyntheticEvent<HTMLImageElement>,
  originalUrl?: string | null,
): void {
  const target = event.currentTarget;
  if (!target) return;

  // Evitar loops infinitos si el original también fallara
  if (target.dataset.fallbackTried === "true") return;
  target.dataset.fallbackTried = "true";

  // Quitar srcset y sizes para que el navegador no reintente la miniatura fallida
  target.removeAttribute("srcset");
  target.removeAttribute("sizes");
  target.srcset = "";
  target.sizes = "";
  target.loading = "eager";

  const fallbackSrc =
    originalUrl && typeof originalUrl === "string" ? originalUrl : revertirMiniatura(target.src);

  target.src = fallbackSrc;
  if (typeof target.setAttribute === "function") {
    target.setAttribute("src", fallbackSrc);
  }
}
