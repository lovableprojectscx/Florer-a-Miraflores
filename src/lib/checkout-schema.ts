import { z } from "zod";

// ─── Fecha mínima: mañana ─────────────────────────────────────────────────────

export function getFechaMinima(baseDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [yearStr, monthStr, dayStr] = formatter.format(baseDate).split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  const tomorrowUtc = new Date(Date.UTC(year, month - 1, day + 1));
  return tomorrowUtc.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ─── Schema de validación ─────────────────────────────────────────────────────

export const checkoutSchema = z.object({
  nombre: z.string().min(2, "Ingresa tu nombre completo"),
  telefono: z
    .string()
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .regex(/^\d+$/, "Solo números"),
  email: z.string().email("Ingresa un email válido"),
  distrito_id: z.string().min(1, "Selecciona un distrito"),
  direccion: z.string().min(5, "Ingresa tu dirección completa"),
  referencia: z.string().optional(),
  fecha_entrega: z
    .string()
    .min(1, "Selecciona una fecha de entrega")
    .refine((f) => f >= getFechaMinima(), "La fecha mínima de entrega es mañana"),
  hora_entrega: z.enum(["manana", "tarde", "noche"], {
    errorMap: () => ({ message: "Selecciona una hora de entrega" }),
  }),
  notas: z.string().optional(),
});

export type CheckoutForm = z.infer<typeof checkoutSchema>;
