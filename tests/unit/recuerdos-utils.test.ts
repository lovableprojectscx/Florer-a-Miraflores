import { describe, it, expect } from "vitest";
import {
  slugifyRecuerdo,
  isRecuerdoVisible,
  getRecuerdoStatus,
  validarRecuerdoForm,
  formatRecuerdoDate,
  construirMensajeWhatsAppRecuerdo,
  generateRecuerdoSchema,
} from "@/lib/recuerdos-utils";
import type { RecuerdoRow } from "@/types/database";

describe("recuerdos-utils: slugifyRecuerdo", () => {
  it("convierte títulos con tildes, mayúsculas y espacios en slugs limpios", () => {
    expect(slugifyRecuerdo("Sorpresa de Aniversario en Miraflores")).toBe(
      "sorpresa-de-aniversario-en-miraflores",
    );
    expect(slugifyRecuerdo("Cumpleaños Feliz con Arreglo Floral & Globos")).toBe(
      "cumpleanos-feliz-con-arreglo-floral-globos",
    );
  });

  it("convierte la letra eñe (ñ) en 'n'", () => {
    expect(slugifyRecuerdo("Celebrando los 15 Años en Surco")).toBe(
      "celebrando-los-15-anos-en-surco",
    );
  });

  it("elimina signos de exclamación e interrogación", () => {
    expect(slugifyRecuerdo("¡Qué hermosa sorpresa para mamá en San Isidro!")).toBe(
      "que-hermosa-sorpresa-para-mama-en-san-isidro",
    );
  });

  it("retorna string vacío si el input es vacío", () => {
    expect(slugifyRecuerdo("")).toBe("");
  });
});

describe("recuerdos-utils: isRecuerdoVisible y getRecuerdoStatus", () => {
  const now = new Date("2026-10-15T18:00:00Z");

  it("retorna true solo si está publicado y fecha <= now", () => {
    expect(
      isRecuerdoVisible({ publicado: true, fecha_publicacion: "2026-10-15T12:00:00Z" }, now),
    ).toBe(true);
    expect(
      isRecuerdoVisible({ publicado: true, fecha_publicacion: "2026-10-15T18:00:00Z" }, now),
    ).toBe(true);
    expect(
      isRecuerdoVisible({ publicado: true, fecha_publicacion: "2026-10-16T12:00:00Z" }, now),
    ).toBe(false);
    expect(
      isRecuerdoVisible({ publicado: false, fecha_publicacion: "2026-10-10T12:00:00Z" }, now),
    ).toBe(false);
  });

  it("retorna estados correctos (publicado, programado, borrador)", () => {
    expect(
      getRecuerdoStatus({ publicado: true, fecha_publicacion: "2026-10-10T12:00:00Z" }, now),
    ).toBe("publicado");
    expect(
      getRecuerdoStatus({ publicado: true, fecha_publicacion: "2026-10-20T12:00:00Z" }, now),
    ).toBe("programado");
    expect(
      getRecuerdoStatus({ publicado: false, fecha_publicacion: "2026-10-10T12:00:00Z" }, now),
    ).toBe("borrador");
  });
});

describe("recuerdos-utils: validarRecuerdoForm", () => {
  it("valida recuerdo sin contenido opcional correctamente", () => {
    const res = validarRecuerdoForm({
      titulo: "Entrega de Aniversario en Miraflores",
      slug: "entrega-de-aniversario-en-miraflores",
      resumen: "5 años celebrando juntos con rosas rojas.",
      contenido: "",
      publicado: false,
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it("rechaza si falta título", () => {
    const res = validarRecuerdoForm({
      titulo: "",
      slug: "entrega",
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.titulo).toBeDefined();
  });

  it("rechaza publicación si no se confirma la autorización del cliente", () => {
    const res = validarRecuerdoForm({
      titulo: "Momento especial",
      slug: "momento-especial",
      publicado: true,
      confirmacion_autorizacion: false,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.confirmacion_autorizacion).toBe(
      "Confirmo que el cliente autorizó publicar esta foto.",
    );
  });

  it("permite publicación si se confirma la autorización del cliente", () => {
    const res = validarRecuerdoForm({
      titulo: "Momento especial",
      slug: "momento-especial",
      publicado: true,
      confirmacion_autorizacion: true,
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });
});

describe("recuerdos-utils: formatRecuerdoDate", () => {
  it("formatea la fecha correctamente", () => {
    const formatted = formatRecuerdoDate("2026-10-15T12:00:00Z");
    expect(formatted).toMatch(/15 de octubre de 2026/);
  });
});

describe("recuerdos-utils: construirMensajeWhatsAppRecuerdo", () => {
  it("arma el mensaje con producto enlazado", () => {
    const msg = construirMensajeWhatsAppRecuerdo({
      titulo: "Sorpresa de Aniversario",
      slug: "sorpresa-de-aniversario",
      tieneProducto: true,
      siteUrl: "https://floreriamiraflores.com",
    });
    expect(msg).toContain('vi la entrega "Sorpresa de Aniversario"');
    expect(msg).toContain("https://floreriamiraflores.com/recuerdos/sorpresa-de-aniversario");
    expect(msg).toContain("quisiera encargar el mismo arreglo floral");
  });

  it("arma el mensaje 'Quiero un arreglo así' cuando no hay producto", () => {
    const msg = construirMensajeWhatsAppRecuerdo({
      titulo: "Momento de Cumpleaños",
      slug: "momento-cumpleanos",
      tieneProducto: false,
      siteUrl: "https://floreriamiraflores.com",
    });
    expect(msg).toContain('vi la entrega "Momento de Cumpleaños"');
    expect(msg).toContain("quiero un arreglo así");
  });
});

describe("recuerdos-utils: generateRecuerdoSchema", () => {
  it("genera Schema Article válido", () => {
    const mockRecuerdo: RecuerdoRow = {
      id: "123",
      titulo: "Entrega en San Isidro",
      slug: "entrega-en-san-isidro",
      resumen: "Ramo de tulipanes",
      contenido: "Entrega sorpresa",
      imagen_portada_url: "https://example.com/foto.webp",
      autor: "Florería Miraflores",
      categoria_relacionada_id: null,
      distrito_id: null,
      producto_id: null,
      fotos_galeria: [],
      destacado: true,
      orden: 1,
      publicado: true,
      fecha_publicacion: "2026-10-15T10:00:00Z",
      meta_title: null,
      meta_description: null,
      created_at: "2026-10-15T10:00:00Z",
      updated_at: "2026-10-15T10:00:00Z",
    };

    const schema = generateRecuerdoSchema({ recuerdo: mockRecuerdo });
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe("Entrega en San Isidro");
    expect(schema.image).toEqual(["https://example.com/foto.webp"]);
  });
});
