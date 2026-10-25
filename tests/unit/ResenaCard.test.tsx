import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TestimonioRow } from "@/types/database";
import { ResenaCard } from "@/components/ResenaCard";

afterEach(() => {
  cleanup();
});

const mockTestimonio: TestimonioRow = {
  id: "testimonio-1",
  nombre: "Andrea Valdivia",
  texto: "El arreglo de tulipanes llegó perfecto y a tiempo. Servicio impecable.",
  estrellas: 5,
  fecha: "2026-10-15",
  fuente: "google",
  enlace_original: "https://google.com/maps/reviews/123",
  imagen_url:
    "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/testimonios/recuerdo-01.webp",
  destacado: true,
  orden: 1,
  activo: true,
  created_at: new Date().toISOString(),
};

describe("ResenaCard — Pruebas de Optimización y Renderizado", () => {
  it("renderiza la reseña con estrellas, nombre y badge de fuente", () => {
    render(<ResenaCard testimonio={mockTestimonio} />);

    expect(screen.getByText("Andrea Valdivia")).toBeDefined();
    expect(screen.getByText(/El arreglo de tulipanes llegó perfecto/i)).toBeDefined();
    expect(screen.getByText("Google")).toBeDefined();
  });

  it("utiliza miniatura optimizada 480w para la imagen del testimonio en vez de la original", () => {
    render(<ResenaCard testimonio={mockTestimonio} />);

    const img = screen.getByRole("img", {
      name: `Foto compartida por ${mockTestimonio.nombre}`,
    }) as HTMLImageElement;

    expect(img).toBeDefined();
    // La imagen debe apuntar a la miniatura 480w generada por ResponsiveImage
    expect(img.src).toContain("thumbs/480/recuerdo-01.webp");
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("renderiza correctamente cuando el testimonio no tiene imagen", () => {
    const sinFoto = { ...mockTestimonio, imagen_url: null };
    render(<ResenaCard testimonio={sinFoto} />);

    const botonFoto = screen.queryByTitle("Ver foto del arreglo");
    expect(botonFoto).toBeNull();
  });
});
