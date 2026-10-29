import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductoRow } from "@/types/database";

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    className,
    to,
    params,
    ...rest
  }: {
    children?: React.ReactNode;
    className?: string;
    to?: string;
    params?: { id?: string };
    [key: string]: unknown;
  }) => {
    const href = params?.id ? `/producto/${params.id}` : to || "#";
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      select: () => Promise.resolve({ data: [] }),
    }),
  },
}));

vi.mock("@/components/Header", () => ({
  Header: () => <header data-testid="mock-header">Header</header>,
}));

vi.mock("@/components/AnnouncementBar", () => ({
  AnnouncementBar: () => <div data-testid="mock-announcement">Bar</div>,
}));

vi.mock("@/components/Footer", () => ({
  Footer: () => <footer data-testid="mock-footer">Footer</footer>,
}));

vi.mock("@/components/WhatsappFab", () => ({
  WhatsappFab: () => <div data-testid="mock-whatsapp">WA</div>,
}));

import { ProductDetailView } from "@/components/ProductDetailView";

describe("Ficha de Producto (ProductDetailView) — Análisis y Calidad de Proporción 1:1", () => {
  const mockProduct: ProductoRow = {
    id: "box-girasoles-001",
    nombre: "Box Radiante de Girasoles Silvestre 002 - Pack 5",
    descripcion: "Radiante arreglo de girasoles frescos seleccionados y flores complementarias.",
    precio: 150,
    imagenes: [
      "https://storage.supabase.co/productos/girasoles-principal.webp",
      "https://storage.supabase.co/productos/girasoles-angulo-2.webp",
    ],
    categoria_id: "cat-box",
    tags: ["destacado"],
    activo: true,
    orden: 1,
    created_at: "2026-10-01T00:00:00Z",
  };

  const mockRelacionado: ProductoRow = {
    id: "prod-rel-01",
    nombre: "Arreglo Floral Primaveral",
    descripcion: "Flores variadas",
    precio: 120,
    imagenes: ["https://storage.supabase.co/productos/primaveral.webp"],
    categoria_id: "cat-box",
    tags: [],
    activo: true,
    orden: 2,
    created_at: "2026-10-01T00:00:00Z",
  };

  const defaultProps = {
    product: mockProduct,
    relacionados: [mockRelacionado],
    categorias: [
      {
        id: "cat-box",
        nombre: "Box",
        slug: "box",
        activo: true,
        orden: 1,
        descripcion: null,
        imagen_url: null,
        parent_id: null,
        created_at: "",
      },
    ],
    config: {
      id: "1",
      whatsapp: "51999999999",
      correo: null,
      horario: null,
      anuncio_barra: null,
      logo_url: null,
    },
    subcat: null,
    parentCat: {
      id: "cat-box",
      nombre: "Box",
      slug: "box",
      activo: true,
      orden: 1,
      descripcion: null,
      imagen_url: null,
      parent_id: null,
      created_at: "",
    },
    tags: [
      {
        id: "tag-1",
        clave: "destacado",
        nombre: "Más Vendido",
        descripcion: null,
        color_badge: "#C4956A",
        orden: 1,
        activo: true,
        mostrar_en_home: false,
      },
    ],
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("el contenedor principal de la foto de producto aplica la clase nativa 'aspect-square' (1:1) sin forzar 4/5", () => {
    render(<ProductDetailView {...defaultProps} />);

    // Buscar la imagen principal por su alt text
    const mainImg = screen.getByAltText(mockProduct.nombre);
    expect(mainImg).toBeInTheDocument();

    // El contenedor inmediato de la foto principal
    const container = mainImg.closest("div");
    expect(container).not.toBeNull();
    expect(container).toHaveClass("aspect-square");
    expect(container).toHaveClass("relative");
    expect(container).toHaveClass("overflow-hidden");

    // Verificar que no tenga inline style aspectRatio: "4/5"
    expect(container?.style.aspectRatio).not.toBe("4/5");
  });

  it("la imagen principal aplica 'object-cover w-full h-full' para llenar limpiamente el cuadro 1:1 sin distorsión", () => {
    render(<ProductDetailView {...defaultProps} />);

    const mainImg = screen.getByAltText(mockProduct.nombre);
    expect(mainImg).toHaveClass("w-full");
    expect(mainImg).toHaveClass("h-full");
    expect(mainImg).toHaveClass("object-cover");
  });

  it("las miniaturas de la galería son botones cuadrados ('w-20 h-20') concordantes con la proporción 1:1", () => {
    render(<ProductDetailView {...defaultProps} />);

    const thumbnailButtons = screen.getAllByRole("button", { name: /ver imagen/i });
    expect(thumbnailButtons).toHaveLength(2);

    for (const btn of thumbnailButtons) {
      expect(btn).toHaveClass("w-20");
      expect(btn).toHaveClass("h-20");
      expect(btn).toHaveClass("flex-shrink-0");
      expect(btn).toHaveClass("overflow-hidden");
    }
  });

  it("al hacer clic en una miniatura, la imagen principal se actualiza manteniendo el contenedor en 'aspect-square'", async () => {
    const user = userEvent.setup();
    render(<ProductDetailView {...defaultProps} />);

    const secondThumbBtn = screen.getByRole("button", { name: "Ver imagen 2" });
    await user.click(secondThumbBtn);

    const updatedMainImg = screen.getByAltText(mockProduct.nombre) as HTMLImageElement;
    expect(updatedMainImg.src).toContain("girasoles-angulo-2.webp");

    const container = updatedMainImg.closest("div");
    expect(container).toHaveClass("aspect-square");
  });

  it("la sección de productos relacionados contiene tarjetas con contenedores en proporción 'aspect-square'", () => {
    render(<ProductDetailView {...defaultProps} />);

    const relatedArticles = screen.getAllByRole("article");
    expect(relatedArticles.length).toBeGreaterThan(0);

    // Verificar que la foto del producto relacionado también usa aspect-square
    const relatedImg = screen.getByAltText(mockRelacionado.nombre);
    const relatedContainer = relatedImg.closest("div");
    expect(relatedContainer).toHaveClass("aspect-square");
  });

  it("en móvil y desktop la columna de compra mantiene visibilidad completa de títulos, precio y botones", () => {
    render(<ProductDetailView {...defaultProps} />);

    expect(screen.getByRole("heading", { level: 1, name: mockProduct.nombre })).toBeInTheDocument();
    expect(screen.getByText(/S\/\.\s*150\.00/)).toBeInTheDocument();
    // Botón principal de compra en la ficha
    const botonesAgregar = screen.getAllByRole("button", { name: /agregar al carrito/i });
    expect(botonesAgregar.length).toBeGreaterThanOrEqual(1);
    expect(botonesAgregar[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /comprar ahora/i })).toBeInTheDocument();
  });
});
