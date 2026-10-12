import { beforeEach, describe, expect, it, vi } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({
  insert: insertMock,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import { crearPedido, type CrearPedidoInput } from "@/lib/queries";

const sampleInput: CrearPedidoInput = {
  nombre_cliente: "María García",
  telefono: "999600482",
  email: "maria@correo.com",
  distrito_id: "550e8400-e29b-41d4-a716-446655440000",
  direccion: "Av. Larco 1234",
  referencia: "Piso 3",
  fecha_entrega: "2026-10-15",
  hora_entrega: "manana",
  notas: "Con tarjeta",
  productos: [
    {
      id: "prod-1",
      nombre: "Ramo Primavera",
      precio: 120,
      imagen: "/img/ramo.webp",
      cantidad: 1,
    },
  ],
  subtotal: 120,
  delivery: 10,
  total: 130,
};

describe("crearPedido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("genera número FM-XXXXXX e inserta el pedido con estado 'pendiente'", async () => {
    insertMock.mockResolvedValueOnce({ error: null });

    const numero = await crearPedido(sampleInput);

    expect(numero).toMatch(/^FM-\d{6}$/);
    expect(fromMock).toHaveBeenCalledWith("pedidos");
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        numero,
        nombre_cliente: "María García",
        estado: "pendiente",
        subtotal: 120,
        delivery: 10,
        total: 130,
      }),
    );
  });

  it("lanza un error legible cuando Supabase devuelve error", async () => {
    insertMock.mockResolvedValueOnce({
      error: { message: "violates foreign key constraint" },
    });

    await expect(crearPedido(sampleInput)).rejects.toThrow(
      "[Supabase] violates foreign key constraint",
    );
  });
});
