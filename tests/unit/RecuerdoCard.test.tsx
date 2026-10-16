import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RecuerdoRow, CategoriaRow, DistritoRow } from "@/types/database";

afterEach(() => {
  cleanup();
});

// Mock de TanStack Router Link
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    to,
    params,
    ...rest
  }: {
    children: React.ReactNode;
    className?: string;
    to: string;
    params?: { slug?: string };
  }) => {
    const href = params?.slug ? `${to.replace("$slug", params.slug)}` : to;
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  },
}));

import { RecuerdoCard } from "@/components/RecuerdoCard";

const mockRecuerdo: RecuerdoRow = {
  id: "recuerdo-01",
  titulo: "Canasta Floral de Rosas y Gerberas Especiales",
  slug: "canasta-floral-rosas-gerberas",
  resumen: "Un detalle inolvidable para mamá",
  contenido: "Detalle completo de la entrega",
  imagen_portada_url: "https://example.com/recuerdo-01.webp",
  autor: null,
  categoria_relacionada_id: "cat-1",
  distrito_id: "dist-1",
  producto_id: "prod-1",
  fotos_galeria: null,
  destacado: true,
  orden: 1,
  publicado: true,
  fecha_publicacion: "2026-10-15T12:00:00Z",
  meta_title: null,
  meta_description: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockCategorias: CategoriaRow[] = [
  {
    id: "cat-1",
    nombre: "Cumpleaños",
    slug: "cumpleanos",
    descripcion: null,
    imagen_url: null,
    activa: true,
    orden: 1,
    parent_id: null,
    created_at: new Date().toISOString(),
  },
];

const mockDistritos: DistritoRow[] = [
  {
    id: "dist-1",
    nombre: "Miraflores",
    costo_envio: 10,
    activo: true,
    orden: 1,
    created_at: new Date().toISOString(),
  },
];

describe("RecuerdoCard — Pruebas de Calidad Visual (RNF-10 y RNF-11)", () => {
  it("RNF-10: la imagen aplica punto focal superior 'center 18%' para no recortar cabezas ni globos de helio", () => {
    render(
      <RecuerdoCard
        recuerdo={mockRecuerdo}
        categorias={mockCategorias}
        distritos={mockDistritos}
      />,
    );

    const img = screen.getByRole("img", { name: mockRecuerdo.titulo });
    expect(img).toBeDefined();

    // Debe tener objectPosition con 18% para preservar el tercio superior de retratos verticales
    expect(img.style.objectPosition).toBe("center 18%");
  });

  it("RNF-11: la tarjeta tiene clase h-full, min-h en título y mt-auto en footer para alineación perfecta", () => {
    const { container } = render(
      <RecuerdoCard
        recuerdo={mockRecuerdo}
        categorias={mockCategorias}
        distritos={mockDistritos}
      />,
    );

    const article = container.querySelector("article");
    expect(article).not.toBeNull();
    // La tarjeta debe ocupar el 100% de la altura disponible en grilla y carrusel
    expect(article?.className).toContain("h-full");
    expect(article?.className).toContain("flex-col");

    // El título debe tener min-h-[2.75rem] para igualar tarjetas de 1 y 2 líneas
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.className).toContain("min-h-[2.75rem]");

    // El pie de la tarjeta debe tener mt-auto para anclarse rígidamente a la base inferior
    const footerAction = screen.getByText(/Ver entrega & arreglo/i).closest("div");
    expect(footerAction?.className).toContain("mt-auto");
  });
});
