import { afterEach, describe, expect, it, vi } from "vitest";
import { checkoutSchema, getFechaMinima } from "@/lib/checkout-schema";

const baseValidData = () => ({
  nombre: "María García",
  telefono: "999600482",
  email: "maria@correo.com",
  distrito_id: "dist-miraflores",
  direccion: "Av. Larco 1234, Miraflores",
  referencia: "Frente al parque",
  fecha_entrega: getFechaMinima(),
  hora_entrega: "manana" as const,
  notas: "Entregar en recepción",
});

describe("checkoutSchema", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("acepta un formulario válido", () => {
    const res = checkoutSchema.safeParse(baseValidData());
    expect(res.success).toBe(true);
  });

  it("rechaza teléfono con menos de 9 dígitos", () => {
    const res = checkoutSchema.safeParse({
      ...baseValidData(),
      telefono: "99960048",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza letras o símbolos en teléfono", () => {
    const res = checkoutSchema.safeParse({
      ...baseValidData(),
      telefono: "99960048a",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza email inválido", () => {
    const res = checkoutSchema.safeParse({
      ...baseValidData(),
      email: "correo-invalido",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza hora_entrega fuera del enum permitido", () => {
    const res = checkoutSchema.safeParse({
      ...baseValidData(),
      hora_entrega: "madrugada",
    });
    expect(res.success).toBe(false);
  });

  it("rechaza la fecha de hoy (mínimo mañana)", () => {
    const hoy = new Date().toISOString().split("T")[0];
    const res = checkoutSchema.safeParse({
      ...baseValidData(),
      fecha_entrega: hoy,
    });
    expect(res.success).toBe(false);
  });

  // Bug conocido, se arregla en Fase 05
  it.fails(
    "getFechaMinima calcula mañana en hora local de Lima después de las 19:00 (UTC-5)",
    () => {
      // 2026-10-12 a las 21:00 en Lima (UTC-5) equivale a 2026-10-13T02:00:00Z en UTC.
      // Mañana en Lima es 2026-10-13, pero toISOString() usa UTC y devuelve 2026-10-14.
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-10-12T21:00:00-05:00"));
      expect(getFechaMinima()).toBe("2026-10-13");
    },
  );
});
