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

  it("getFechaMinima calcula mañana en hora local de Lima a diferentes horas del día y fin de año", () => {
    vi.useFakeTimers();

    // 10:00 Lima -> mañana es 2026-10-13
    vi.setSystemTime(new Date("2026-10-12T10:00:00-05:00"));
    expect(getFechaMinima()).toBe("2026-10-13");

    // 18:59 Lima -> mañana es 2026-10-13
    vi.setSystemTime(new Date("2026-10-12T18:59:00-05:00"));
    expect(getFechaMinima()).toBe("2026-10-13");

    // 19:00 Lima (00:00 UTC día siguiente) -> mañana en Lima sigue siendo 2026-10-13
    vi.setSystemTime(new Date("2026-10-12T19:00:00-05:00"));
    expect(getFechaMinima()).toBe("2026-10-13");

    // 23:59 Lima (04:59 UTC día siguiente) -> mañana en Lima sigue siendo 2026-10-13
    vi.setSystemTime(new Date("2026-10-12T23:59:00-05:00"));
    expect(getFechaMinima()).toBe("2026-10-13");

    // 31 de diciembre 21:00 Lima (02:00 UTC del 1 de enero) -> mañana en Lima es 2027-01-01
    vi.setSystemTime(new Date("2026-12-31T21:00:00-05:00"));
    expect(getFechaMinima()).toBe("2027-01-01");
  });
});
