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

  it("éxito al primer intento: genera FM-XXXXXX y llama a insert una sola vez", async () => {
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

  it("duplicado (código 23505) y luego éxito: reintenta y genera un nuevo número en el segundo intento", async () => {
    insertMock
      .mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      })
      .mockResolvedValueOnce({ error: null });

    const numero = await crearPedido(sampleInput);

    expect(numero).toMatch(/^FM-\d{6}$/);
    expect(insertMock).toHaveBeenCalledTimes(2);
  });

  it("3 duplicados seguidos (código 23505): falla tras 3 intentos y ofrece mensaje con WhatsApp", async () => {
    insertMock
      .mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      })
      .mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      })
      .mockResolvedValueOnce({
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      });

    await expect(crearPedido(sampleInput)).rejects.toThrow(
      /No pudimos generar un número de pedido único tras 3 intentos.*WhatsApp.*\+51 999 600 482/,
    );
    expect(insertMock).toHaveBeenCalledTimes(3);
  });

  it("error distinto de 23505: lanza de inmediato y NO reintenta (1 solo intento)", async () => {
    insertMock.mockResolvedValueOnce({
      error: { code: "42501", message: "permission denied for table pedidos" },
    });

    await expect(crearPedido(sampleInput)).rejects.toThrow(
      "[Supabase] permission denied for table pedidos",
    );
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});
