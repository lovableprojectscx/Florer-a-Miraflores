import { describe, expect, it } from "vitest";
import { slugify, extractIdFromSlug } from "@/lib/utils";

describe("slugify", () => {
  it("convierte tildes, ñ y mayúsculas a minúsculas sin acentos", () => {
    expect(slugify("Canción de Otoño y Cumpleaños")).toBe("cancion-de-otono-y-cumpleanos");
  });

  it("reemplaza espacios, símbolos y guiones repetidos", () => {
    expect(slugify("  Box   Romántico --- Edición #1!  ")).toBe("box-romantico-edicion-1");
  });
});

describe("extractIdFromSlug", () => {
  const sampleUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("devuelve el UUID directamente si el input es solo un UUID", () => {
    expect(extractIdFromSlug(sampleUuid)).toBe(sampleUuid);
  });

  it("extrae el UUID cuando viene precedido por el slug del nombre", () => {
    expect(extractIdFromSlug(`ramo-primavera-especial-${sampleUuid}`)).toBe(sampleUuid);
  });

  it("resuelve IDs locales conocidos como fallback", () => {
    expect(extractIdFromSlug("velvet-box")).toBe("velvet-box");
    expect(extractIdFromSlug("mi-producto-box-romantico")).toBe("box-romantico");
  });

  it("devuelve el mismo string si no coincide con UUID ni ID local", () => {
    expect(extractIdFromSlug("producto-personalizado")).toBe("producto-personalizado");
  });
});
