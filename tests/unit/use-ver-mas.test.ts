import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useVerMas } from "@/hooks/use-ver-mas";

interface ItemMock {
  id: string;
  nombre: string;
}

function crearItems(cantidad: number, prefijo = "item"): ItemMock[] {
  return Array.from({ length: cantidad }, (_, i) => ({
    id: `${prefijo}-${i + 1}`,
    nombre: `Producto ${i + 1}`,
  }));
}

describe("useVerMas — paginación incremental en cliente", () => {
  it("maneja 0 items correctamente", () => {
    const { result } = renderHook(() => useVerMas(crearItems(0), 24));
    expect(result.current.total).toBe(0);
    expect(result.current.mostrando).toBe(0);
    expect(result.current.visibles).toHaveLength(0);
    expect(result.current.hayMas).toBe(false);
  });

  it("maneja menos de 24 items (ej. 10) sin mostrar 'hayMas'", () => {
    const items = crearItems(10);
    const { result } = renderHook(() => useVerMas(items, 24));
    expect(result.current.total).toBe(10);
    expect(result.current.mostrando).toBe(10);
    expect(result.current.visibles).toHaveLength(10);
    expect(result.current.hayMas).toBe(false);
  });

  it("maneja exactamente 24 items sin mostrar 'hayMas'", () => {
    const items = crearItems(24);
    const { result } = renderHook(() => useVerMas(items, 24));
    expect(result.current.total).toBe(24);
    expect(result.current.mostrando).toBe(24);
    expect(result.current.visibles).toHaveLength(24);
    expect(result.current.hayMas).toBe(false);
  });

  it("maneja 25 items mostrando 24 al inicio y 25 tras llamar verMas()", () => {
    const items = crearItems(25);
    const { result } = renderHook(() => useVerMas(items, 24));
    expect(result.current.total).toBe(25);
    expect(result.current.mostrando).toBe(24);
    expect(result.current.visibles).toHaveLength(24);
    expect(result.current.hayMas).toBe(true);

    act(() => {
      result.current.verMas();
    });

    expect(result.current.mostrando).toBe(25);
    expect(result.current.visibles).toHaveLength(25);
    expect(result.current.hayMas).toBe(false);
  });

  it("maneja 300 items sumando de a 24 con verMas() sin pasarse del total", () => {
    const items = crearItems(300);
    const { result } = renderHook(() => useVerMas(items, 24));

    expect(result.current.mostrando).toBe(24);
    expect(result.current.hayMas).toBe(true);

    // 11 clics: 24 + 11*24 = 288
    for (let i = 1; i <= 11; i++) {
      act(() => {
        result.current.verMas();
      });
      expect(result.current.mostrando).toBe(24 * (i + 1));
      expect(result.current.hayMas).toBe(true);
    }

    expect(result.current.mostrando).toBe(288);

    // Clic 12: llega a 300 sin pasarse a 312
    act(() => {
      result.current.verMas();
    });
    expect(result.current.mostrando).toBe(300);
    expect(result.current.visibles).toHaveLength(300);
    expect(result.current.hayMas).toBe(false);

    // Un clic adicional sigue en 300
    act(() => {
      result.current.verMas();
    });
    expect(result.current.mostrando).toBe(300);
  });

  it("se reinicia a 24 cuando cambia la lista (filtro u orden) pero NO resetea si es la misma lista con otra identidad", () => {
    const inicial = crearItems(60);
    const { result, rerender } = renderHook(({ lista }) => useVerMas(lista, 24), {
      initialProps: { lista: inicial },
    });

    act(() => {
      result.current.verMas();
    });
    expect(result.current.mostrando).toBe(48);

    // Misma lista pero nuevo array en memoria (nueva referencia) -> NO debe resetear
    rerender({ lista: [...inicial] });
    expect(result.current.mostrando).toBe(48);

    // Lista con distinto orden -> SÍ debe resetear a 24
    rerender({ lista: [...inicial].reverse() });
    expect(result.current.mostrando).toBe(24);

    // Avanzar a 48 otra vez y cambiar a lista filtrada de 40 items -> SÍ resetea a 24
    act(() => {
      result.current.verMas();
    });
    expect(result.current.mostrando).toBe(48);

    rerender({ lista: inicial.slice(0, 40) });
    expect(result.current.mostrando).toBe(24);
    expect(result.current.total).toBe(40);
  });
});
