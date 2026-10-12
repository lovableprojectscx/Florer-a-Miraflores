import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProductFilters } from "@/components/ProductFilters";
import type { ProductoRow } from "@/types/database";

const makeProducto = (id: string, precio: number): ProductoRow => ({
  id,
  nombre: `Producto ${id}`,
  precio,
  descripcion: null,
  imagenes: ["/img/test.webp"],
  categoria_id: "cat-1",
  tags: [],
  activo: true,
  orden: 0,
  created_at: "2026-10-01T00:00:00Z",
});

const productosMuestra: ProductoRow[] = [
  makeProducto("p1", 80),
  makeProducto("p2", 150),
  makeProducto("p3", 250),
  makeProducto("p4", 350),
  makeProducto("p5", 100),
];

describe("useProductFilters", () => {
  it("maneja una lista vacía sin errores", () => {
    const { result } = renderHook(() => useProductFilters([]));
    expect(result.current.filtrados).toEqual([]);
  });

  it("ordena por precio ascendente y descendente", () => {
    const { result } = renderHook(() => useProductFilters(productosMuestra));

    act(() => {
      result.current.setOrden("precio_asc");
    });
    expect(result.current.filtrados.map((p) => p.precio)).toEqual([80, 100, 150, 250, 350]);

    act(() => {
      result.current.setOrden("precio_desc");
    });
    expect(result.current.filtrados.map((p) => p.precio)).toEqual([350, 250, 150, 100, 80]);
  });

  it("filtra correctamente cada rango de precio", () => {
    const { result } = renderHook(() => useProductFilters(productosMuestra));

    act(() => {
      result.current.setRango("0-100");
    });
    expect(result.current.filtrados.map((p) => p.precio)).toEqual([80, 100]);

    act(() => {
      result.current.setRango("100-200");
    });
    expect(result.current.filtrados.map((p) => p.precio)).toEqual([150, 100]);

    act(() => {
      result.current.setRango("200-300");
    });
    expect(result.current.filtrados.map((p) => p.precio)).toEqual([250]);

    act(() => {
      result.current.setRango("300+");
    });
    expect(result.current.filtrados.map((p) => p.precio)).toEqual([350]);

    act(() => {
      result.current.setRango("todos");
    });
    expect(result.current.filtrados).toHaveLength(5);
  });
});
