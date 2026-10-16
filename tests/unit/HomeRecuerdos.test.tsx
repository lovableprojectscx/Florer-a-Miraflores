import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RecuerdoRow, CategoriaRow, DistritoRow } from "@/types/database";

afterEach(() => {
  cleanup();
});

// Mock de Link de TanStack Router
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

import { HomeRecuerdos } from "@/components/HomeRecuerdos";

const mockCategorias: CategoriaRow[] = [
  {
    id: "cat-cumple",
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
    id: "dist-miraflores",
    nombre: "Miraflores",
    costo_envio: 10,
    activo: true,
    orden: 1,
    created_at: new Date().toISOString(),
  },
];

function crearRecuerdos(cantidad: number): RecuerdoRow[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `recuerdo-${i + 1}`,
    titulo: `Entrega especial ${i + 1}`,
    slug: `entrega-especial-${i + 1}`,
    resumen: i === 0 ? "Para la mejor mamá del mundo" : null,
    contenido: "Relato de la entrega floral",
    imagen_portada_url: `https://example.com/recuerdo-${i + 1}.webp`,
    autor: null,
    categoria_relacionada_id: i === 0 ? "cat-cumple" : null,
    distrito_id: i === 0 ? "dist-miraflores" : null,
    producto_id: null,
    fotos_galeria: null,
    destacado: i === 0,
    orden: i + 1,
    publicado: true,
    fecha_publicacion: "2026-10-15T12:00:00Z",
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

describe("HomeRecuerdos - Franja en el Home", () => {
  it("NO se renderiza (retorna null) si el arreglo de recuerdos está vacío", () => {
    const { container } = render(
      <HomeRecuerdos recuerdos={[]} categorias={mockCategorias} distritos={mockDistritos} />,
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("home-recuerdos-section")).toBeNull();
    expect(screen.queryByText(/Recuerdos de entrega/i)).toBeNull();
  });

  it("NO se renderiza (retorna null) si recuerdos es undefined o nulo", () => {
    // @ts-expect-error probando valor nulo defensivo
    const { container } = render(<HomeRecuerdos recuerdos={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza la sección con título, enlace a /recuerdos y carrusel si hay recuerdos publicados", () => {
    const recuerdos = crearRecuerdos(4);
    render(
      <HomeRecuerdos recuerdos={recuerdos} categorias={mockCategorias} distritos={mockDistritos} />,
    );

    // Debe existir la sección en el DOM
    const section = screen.getByTestId("home-recuerdos-section");
    expect(section).toBeDefined();

    // Debe tener el título exacto
    expect(screen.getByRole("heading", { level: 2, name: /Recuerdos de entrega/i })).toBeDefined();

    // Debe contener el enlace a /recuerdos
    const verTodos = screen.getByTestId("ver-todos-recuerdos-link");
    expect(verTodos.getAttribute("href")).toBe("/recuerdos");

    // Debe renderizar los 4 recuerdos
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByText(`Entrega especial ${i}`)).toBeDefined();
    }
  });

  it("muestra ocasión y distrito SOLO si existen, sin texto de relleno", () => {
    const recuerdos = crearRecuerdos(2);
    // recuerdo 1 tiene categoria 'Cumpleaños' y distrito 'Miraflores'
    // recuerdo 2 NO tiene categoria ni distrito
    render(
      <HomeRecuerdos recuerdos={recuerdos} categorias={mockCategorias} distritos={mockDistritos} />,
    );

    // Recuerdo 1: badges presentes
    expect(screen.getByText("Cumpleaños")).toBeDefined();
    expect(screen.getByText("Miraflores")).toBeDefined();
    expect(screen.getByText('"Para la mejor mamá del mundo"')).toBeDefined();

    // No debe haber textos de relleno como 'Ocasión no especificada' ni distritos inventados
    expect(screen.queryByText(/no especificada/i)).toBeNull();
    expect(screen.queryByText(/sin distrito/i)).toBeNull();
  });

  it("RNF-11: el slider utiliza items-stretch y cada contenedor de slide flex-col para igualar alturas", () => {
    const recuerdos = crearRecuerdos(3);
    const { container } = render(
      <HomeRecuerdos recuerdos={recuerdos} categorias={mockCategorias} distritos={mockDistritos} />,
    );

    const slider = container.querySelector(".snap-x");
    expect(slider?.className).toContain("items-stretch");

    const slides = container.querySelectorAll(".snap-start");
    expect(slides.length).toBe(3);
    slides.forEach((slide) => {
      expect(slide.className).toContain("flex-col");
    });
  });
});
