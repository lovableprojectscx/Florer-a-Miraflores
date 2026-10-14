import { describe, it, expect } from "vitest";
import {
  validateTestimonioForm,
  formatRating,
  formatGoogleSummary,
  shouldShowHomeTestimonios,
} from "@/lib/resenas-utils";

describe("Validación del formulario de testimonios (Prompt 07)", () => {
  it("falla si el nombre está vacío", () => {
    const res = validateTestimonioForm({
      nombre: "",
      texto: "Excelente atención y hermosas flores",
      estrellas: 5,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.nombre).toBe("El nombre es obligatorio.");
  });

  it("falla si el nombre solo tiene espacios", () => {
    const res = validateTestimonioForm({
      nombre: "   ",
      texto: "Excelente atención y hermosas flores",
      estrellas: 5,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.nombre).toBe("El nombre es obligatorio.");
  });

  it("falla si el texto está vacío", () => {
    const res = validateTestimonioForm({
      nombre: "Carlos M.",
      texto: "",
      estrellas: 5,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.texto).toBe("El texto de la reseña es obligatorio.");
  });

  it("falla si el texto tiene menos de 10 caracteres", () => {
    const res = validateTestimonioForm({
      nombre: "Carlos M.",
      texto: "Muy bueno", // 9 chars
      estrellas: 5,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.texto).toBe("El texto de la reseña debe tener al menos 10 caracteres.");
  });

  it("permite texto con exactamente 10 caracteres", () => {
    const res = validateTestimonioForm({
      nombre: "Carlos M.",
      texto: "1234567890",
      estrellas: 5,
    });
    expect(res.errors.texto).toBeUndefined();
  });

  it("falla si las estrellas son menores a 1 o mayores a 5 o no enteras", () => {
    const casosInvalidos = [0, -1, 6, 10, 4.5, NaN];
    for (const estrellas of casosInvalidos) {
      const res = validateTestimonioForm({
        nombre: "Ana R.",
        texto: "Un ramo precioso que duró semanas intacto",
        estrellas,
      });
      expect(res.valid).toBe(false);
      expect(res.errors.estrellas).toBe(
        "La calificación debe ser un número entero entre 1 y 5 estrellas.",
      );
    }
  });

  it("acepta estrellas válidas del 1 al 5", () => {
    for (let estrellas = 1; estrellas <= 5; estrellas++) {
      const res = validateTestimonioForm({
        nombre: "Ana R.",
        texto: "Un ramo precioso que duró semanas intacto",
        estrellas,
        fuente: "google",
      });
      expect(res.valid).toBe(true);
      expect(res.errors).toEqual({});
    }
  });

  it("rechaza fuentes no permitidas", () => {
    const res = validateTestimonioForm({
      nombre: "Ana R.",
      texto: "Un ramo precioso que duró semanas intacto",
      estrellas: 5,
      fuente: "twitter" as unknown as TestimonioFuente,
    });
    expect(res.valid).toBe(false);
    expect(res.errors.fuente).toBe("La fuente debe ser google, whatsapp, facebook o directo.");
  });
});

describe("Formato del resumen de Google con coma decimal", () => {
  it("formatea enteros con un decimal y coma (ej. 5 -> '5,0')", () => {
    expect(formatRating(5)).toBe("5,0");
  });

  it("formatea decimales correctamente con coma (ej. 4.9 -> '4,9')", () => {
    expect(formatRating(4.9)).toBe("4,9");
    expect(formatRating(4.85)).toBe("4,9");
    expect(formatRating(4.2)).toBe("4,2");
  });

  it("maneja nulos o indefinidos devolviendo '0,0'", () => {
    expect(formatRating(null)).toBe("0,0");
    expect(formatRating(undefined)).toBe("0,0");
    expect(formatRating(NaN)).toBe("0,0");
  });

  it("construye el resumen textual completo '★ 4,9 · 120 reseñas en Google'", () => {
    expect(formatGoogleSummary(4.9, 120)).toBe("★ 4,9 · 120 reseñas en Google");
    expect(formatGoogleSummary(5, 1)).toBe("★ 5,0 · 1 reseña en Google");
  });

  it("no muestra resumen inventado si falta rating o count", () => {
    expect(formatGoogleSummary(null, 120)).toBeNull();
    expect(formatGoogleSummary(4.9, null)).toBeNull();
    expect(formatGoogleSummary(4.9, 0)).toBeNull();
    expect(formatGoogleSummary(undefined, undefined)).toBeNull();
  });
});

describe("Regla de visibilidad de la franja en el home", () => {
  it("no se muestra si mostrar_resenas_home es false aunque haya >= 3 reseñas", () => {
    expect(shouldShowHomeTestimonios(false, 3)).toBe(false);
    expect(shouldShowHomeTestimonios(false, 10)).toBe(false);
    expect(shouldShowHomeTestimonios(null, 5)).toBe(false);
    expect(shouldShowHomeTestimonios(undefined, 5)).toBe(false);
  });

  it("no se muestra si mostrar_resenas_home es true pero hay menos de 3 activas", () => {
    expect(shouldShowHomeTestimonios(true, 0)).toBe(false);
    expect(shouldShowHomeTestimonios(true, 1)).toBe(false);
    expect(shouldShowHomeTestimonios(true, 2)).toBe(false);
  });

  it("se muestra solo si mostrar_resenas_home es true Y hay al menos 3 reseñas activas", () => {
    expect(shouldShowHomeTestimonios(true, 3)).toBe(true);
    expect(shouldShowHomeTestimonios(true, 6)).toBe(true);
    expect(shouldShowHomeTestimonios(true, 15)).toBe(true);
  });
});
