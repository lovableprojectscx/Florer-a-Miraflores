import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProductoRow } from "@/types/database";

afterEach(() => {
  cleanup();
});

// Mock de Link de TanStack Router y supabase para testear ProductGrid en aislamiento
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    params,
  }: {
    children: React.ReactNode;
    className?: string;
    params?: { id?: string };
  }) => (
    <a href={`/producto/${params?.id ?? ""}`} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [] }),
    }),
  },
}));

import { ProductGrid } from "@/components/ProductGrid";

function crearProductos(cantidad: number): ProductoRow[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `prod-${i + 1}`,
    nombre: `Ramo Especial ${i + 1}`,
    precio: 100 + i,
    descripcion: "Descripción de prueba",
    imagenes: [`https://example.com/foto-${i + 1}.webp`],
    categoria_id: "cat-1",
    tags: [],
    activo: true,
    orden: i + 1,
    created_at: "2026-10-12T00:00:00Z",
  }));
}

describe("ProductGrid — paginación 'Ver más' y placeholder de imagen", () => {
  it("con 30 productos y tamanoLote=24 muestra 24 tarjetas y el botón 'Ver más'; tras clic muestra 30 y el botón desaparece", async () => {
    const user = userEvent.setup();
    const productos = crearProductos(30);

    render(<ProductGrid products={productos} tamanoLote={24} />);

    expect(screen.getAllByRole("article")).toHaveLength(24);
    expect(screen.getByText("Mostrando 24 de 30")).toBeInTheDocument();

    const btnVerMas = screen.getByRole("button", { name: /ver más/i });
    expect(btnVerMas).toBeInTheDocument();

    await user.click(btnVerMas);

    const articulos = screen.getAllByRole("article");
    expect(articulos).toHaveLength(30);
    expect(screen.getByText("Mostrando 30 de 30")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ver más/i })).not.toBeInTheDocument();

    // Verifica que el foco pasó a la primera tarjeta nueva (índice 24, tarjeta #25)
    expect(document.activeElement).toBe(articulos[24]);
  });

  it("sin tamanoLote muestra todos los productos sin botón 'Ver más' (caso relacionados)", () => {
    const productos = crearProductos(30);
    render(<ProductGrid products={productos} />);

    expect(screen.getAllByRole("article")).toHaveLength(30);
    expect(screen.queryByRole("button", { name: /ver más/i })).not.toBeInTheDocument();
  });

  it("producto sin imágenes (imagenes vacío o null) muestra el placeholder de forma explícita sin depender de onError", () => {
    const productosSinImagen: ProductoRow[] = [
      {
        ...crearProductos(1)[0],
        id: "sin-img-1",
        nombre: "Arreglo Sin Foto Array Vacío",
        imagenes: [],
      },
      {
        ...crearProductos(1)[0],
        id: "sin-img-2",
        nombre: "Arreglo Sin Foto Null",
        imagenes: null as unknown as string[],
      },
    ];

    render(<ProductGrid products={productosSinImagen} tamanoLote={24} />);

    const img1 = screen.getByAltText("Arreglo Sin Foto Array Vacío") as HTMLImageElement;
    const img2 = screen.getByAltText("Arreglo Sin Foto Null") as HTMLImageElement;

    expect(img1.getAttribute("src")).toBeTruthy();
    expect(img1.getAttribute("src")).not.toBe("undefined");
    expect(img2.getAttribute("src")).toBeTruthy();
    expect(img2.getAttribute("src")).not.toBe("undefined");
  });

  it("tarjetas de producto restringen srcset a 480w para proteger la cuota de transferencia", () => {
    const productos = [
      {
        ...crearProductos(1)[0],
        imagenes: [
          "https://sdrkiomeesoctsxeidmu.supabase.co/storage/v1/object/public/productos/ramo.webp",
        ],
      },
    ];

    render(<ProductGrid products={productos} tamanoLote={24} />);

    const img = screen.getByAltText(productos[0].nombre) as HTMLImageElement;
    const srcset = img.getAttribute("srcset");

    // Debe contener 480w y NO debe contener 960w ni 2560w para tarjetas de catálogo
    expect(srcset).toContain("thumbs/480/ramo.webp 480w");
    expect(srcset).not.toContain("960w");
  });
});
