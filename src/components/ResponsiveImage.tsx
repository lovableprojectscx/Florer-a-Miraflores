import React, { useState, useEffect, useRef } from "react";
import {
  imagenUrl,
  imagenSrcSet,
  revertirMiniatura,
  type ImageWidth,
} from "@/lib/image-utils";

export interface ResponsiveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  url?: string | null;
  anchoMiniatura?: ImageWidth;
  fallbackUrl?: string;
}

/**
 * Componente unificado para imágenes responsive con fallback automático robusto.
 * Si la miniatura no existe o falla (404), quita inmediatamente `srcset` y `sizes`
 * y asigna la URL original con carga eager, previniendo que el navegador continúe
 * intentando candidatos de srcset.
 */
export function ResponsiveImage({
  url,
  anchoMiniatura = 480,
  fallbackUrl,
  src,
  srcSet,
  sizes,
  alt = "",
  loading = "lazy",
  className,
  onError,
  ...rest
}: ResponsiveImageProps) {
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const rawUrl = url ?? (typeof src === "string" ? src : "");
  const fallback = fallbackUrl || revertirMiniatura(rawUrl) || rawUrl;

  const currentSrc = hasError
    ? fallback
    : anchoMiniatura
      ? imagenUrl(rawUrl, anchoMiniatura)
      : rawUrl;

  // Si falló, nunca renderizar srcset ni sizes para que el navegador no ignore `src`
  const currentSrcSet = hasError ? undefined : (srcSet ?? imagenSrcSet(rawUrl));
  const currentSizes = hasError ? undefined : sizes;

  useEffect(() => {
    // Detectar fallos ocurridos antes de la hidratación de React durante el parseo inicial
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setHasError(true);
    }
  }, [rawUrl]);

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      srcSet={currentSrcSet}
      sizes={currentSizes}
      data-thumb-src={anchoMiniatura ? imagenUrl(rawUrl, anchoMiniatura) : undefined}
      data-thumb-srcset={imagenSrcSet(rawUrl)}
      alt={alt}
      loading={hasError ? "eager" : loading}
      decoding="async"
      className={className}
      onError={(e) => {
        setHasError(true);
        const target = e.currentTarget;
        if (target) {
          target.removeAttribute("srcset");
          target.removeAttribute("sizes");
          target.srcset = "";
          target.sizes = "";
          target.loading = "eager";
          target.src = fallback;
        }
        if (onError) onError(e);
      }}
      {...rest}
    />
  );
}
