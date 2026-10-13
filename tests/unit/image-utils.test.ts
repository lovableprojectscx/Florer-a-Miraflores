import { describe, it, expect, vi } from "vitest";
import {
  imagenUrl,
  imagenSrcSet,
  revertirMiniatura,
  isSupabaseStorageUrl,
  onImageThumbError,
} from "@/lib/image-utils";
import type { SyntheticEvent } from "react";

describe("image-utils (Fase 06-B)", () => {
  const original =
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/1779228953235-zv9s9dw0ul.webp";
  const expected480 =
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/thumbs/480/1779228953235-zv9s9dw0ul.webp";
  const expected960 =
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/thumbs/960/1779228953235-zv9s9dw0ul.webp";

  describe("isSupabaseStorageUrl", () => {
    it("reconoce URLs de objetos públicos de Supabase", () => {
      expect(isSupabaseStorageUrl(original)).toBe(true);
      expect(isSupabaseStorageUrl(expected480)).toBe(true);
    });

    it("descarta assets locales o URLs externas", () => {
      expect(isSupabaseStorageUrl("/assets/hero-flowers.webp")).toBe(false);
      expect(isSupabaseStorageUrl("https://images.unsplash.com/photo-1")).toBe(false);
      expect(isSupabaseStorageUrl(null)).toBe(false);
      expect(isSupabaseStorageUrl("")).toBe(false);
    });
  });

  describe("imagenUrl", () => {
    it("genera URL de miniatura 480 y 960 correctamente", () => {
      expect(imagenUrl(original, 480)).toBe(expected480);
      expect(imagenUrl(original, 960)).toBe(expected960);
    });

    it("no duplica prefijo thumbs si la URL ya era una miniatura", () => {
      expect(imagenUrl(expected480, 960)).toBe(expected960);
      expect(imagenUrl(expected960, 480)).toBe(expected480);
    });

    it("retorna la URL intacta si no se solicita ancho", () => {
      expect(imagenUrl(original)).toBe(original);
    });

    it("respeta assets locales y URLs externas sin modificarlas", () => {
      const local = "/assets/hero-flowers.webp";
      expect(imagenUrl(local, 480)).toBe(local);
      expect(imagenUrl(local, 960)).toBe(local);
    });

    it("maneja valores vacíos, nulos o indefinidos", () => {
      expect(imagenUrl(null, 480)).toBe("");
      expect(imagenUrl(undefined, 480)).toBe("");
      expect(imagenUrl("", 480)).toBe("");
    });
  });

  describe("imagenSrcSet", () => {
    it("genera string srcset con 480w y 960w para URLs de Supabase", () => {
      const srcset = imagenSrcSet(original);
      expect(srcset).toBe(`${expected480} 480w, ${expected960} 960w`);
    });

    it("retorna undefined para assets locales o no válidos", () => {
      expect(imagenSrcSet("/assets/hero-flowers.webp")).toBeUndefined();
      expect(imagenSrcSet(null)).toBeUndefined();
      expect(imagenSrcSet("")).toBeUndefined();
    });
  });

  describe("revertirMiniatura", () => {
    it("revierte URLs de thumbs/480 y thumbs/960 al original", () => {
      expect(revertirMiniatura(expected480)).toBe(original);
      expect(revertirMiniatura(expected960)).toBe(original);
    });

    it("retorna la URL intacta si no contenía prefijo thumbs", () => {
      expect(revertirMiniatura(original)).toBe(original);
    });
  });

  describe("onImageThumbError (fallback)", () => {
    it("reemplaza src con originalUrl explícito y remueve srcset", () => {
      const img = {
        src: expected480,
        dataset: {} as Record<string, string>,
        removeAttribute: vi.fn(),
      } as unknown as HTMLImageElement;

      const event = {
        currentTarget: img,
      } as SyntheticEvent<HTMLImageElement>;

      onImageThumbError(event, original);

      expect(img.src).toBe(original);
      expect(img.removeAttribute).toHaveBeenCalledWith("srcset");
      expect(img.dataset.fallbackTried).toBe("true");
    });

    it("revierte automáticamente si no se pasa originalUrl", () => {
      const img = {
        src: expected480,
        dataset: {} as Record<string, string>,
        removeAttribute: vi.fn(),
      } as unknown as HTMLImageElement;

      const event = {
        currentTarget: img,
      } as SyntheticEvent<HTMLImageElement>;

      onImageThumbError(event);

      expect(img.src).toBe(original);
      expect(img.removeAttribute).toHaveBeenCalledWith("srcset");
      expect(img.dataset.fallbackTried).toBe("true");
    });

    it("evita bucles infinitos si se vuelve a disparar onError", () => {
      const img = {
        src: original,
        dataset: { fallbackTried: "true" } as Record<string, string>,
        removeAttribute: vi.fn(),
      } as unknown as HTMLImageElement;

      const event = {
        currentTarget: img,
      } as SyntheticEvent<HTMLImageElement>;

      onImageThumbError(event, original);

      // No debe hacer nada porque fallbackTried ya es "true"
      expect(img.removeAttribute).not.toHaveBeenCalled();
    });
  });
});
