import { describe, expect, it } from "vitest";
import { CONSENTIMIENTO_TEXTO } from "@/components/PopupModal";

// Helper de validación que replica las reglas del popup
function validarPopupInput(input: { nombre: string; telefono: string; consent: boolean }): {
  valid: boolean;
  error?: string;
} {
  const cleanNombre = input.nombre.trim();
  if (!cleanNombre || cleanNombre.length < 2 || cleanNombre.length > 60) {
    return { valid: false, error: "Por favor ingresa tu nombre (entre 2 y 60 caracteres)." };
  }

  const cleanPhone = input.telefono.replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length !== 9 || !cleanPhone.startsWith("9")) {
    return {
      valid: false,
      error: "Ingresa un número móvil de 9 dígitos válido que empiece en 9.",
    };
  }

  if (!input.consent) {
    return {
      valid: false,
      error: "Debes aceptar la autorización para recibir novedades por WhatsApp.",
    };
  }

  return { valid: true };
}

describe("Popup Club Florería Miraflores - Validación", () => {
  it("acepta datos válidos", () => {
    const res = validarPopupInput({
      nombre: "Sofía Martínez",
      telefono: "999600482",
      consent: true,
    });
    expect(res.valid).toBe(true);
  });

  it("rechaza nombre vacío o de 1 solo caracter", () => {
    expect(validarPopupInput({ nombre: "", telefono: "999600482", consent: true }).valid).toBe(
      false,
    );
    expect(validarPopupInput({ nombre: "A", telefono: "999600482", consent: true }).valid).toBe(
      false,
    );
  });

  it("rechaza nombre mayor a 60 caracteres", () => {
    const nombreLargo = "A".repeat(61);
    expect(
      validarPopupInput({ nombre: nombreLargo, telefono: "999600482", consent: true }).valid,
    ).toBe(false);
  });

  it("rechaza teléfono que no tenga 9 dígitos o no empiece en 9", () => {
    expect(validarPopupInput({ nombre: "Sofía", telefono: "899600482", consent: true }).valid).toBe(
      false,
    );
    expect(validarPopupInput({ nombre: "Sofía", telefono: "99960048", consent: true }).valid).toBe(
      false,
    );
    expect(
      validarPopupInput({ nombre: "Sofía", telefono: "9996004821", consent: true }).valid,
    ).toBe(false);
    expect(validarPopupInput({ nombre: "Sofía", telefono: "abc999600", consent: true }).valid).toBe(
      false,
    );
  });

  it("rechaza si no se marca la casilla de consentimiento", () => {
    expect(
      validarPopupInput({ nombre: "Sofía", telefono: "999600482", consent: false }).valid,
    ).toBe(false);
  });

  it("el texto de consentimiento coincide exactamente con el texto legal requerido", () => {
    expect(CONSENTIMIENTO_TEXTO).toBe(
      "Acepto que Florería Miraflores me envíe promociones y novedades por WhatsApp. Puedo darme de baja cuando quiera. Ver Política de privacidad.",
    );
  });
});
