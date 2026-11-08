import { describe, expect, it } from "vitest";
import {
  slugify,
  extractIdFromSlug,
  formatProductMarkdown,
  stripMarkdown,
  safeJsonLd,
} from "@/lib/utils";

describe("slugify", () => {
  it("convierte tildes, ñ y mayúsculas a minúsculas sin acentos", () => {
    expect(slugify("Canción de Otoño y Cumpleaños")).toBe("cancion-de-otono-y-cumpleanos");
  });

  it("reemplaza espacios, símbolos y guiones repetidos", () => {
    expect(slugify("  Box   Romántico --- Edición #1!  ")).toBe("box-romantico-edicion-1");
  });
});

describe("extractIdFromSlug", () => {
  const sampleUuid = "550e8400-e29b-41d4-a716-446655440000";

  it("devuelve el UUID directamente si el input es solo un UUID", () => {
    expect(extractIdFromSlug(sampleUuid)).toBe(sampleUuid);
  });

  it("extrae el UUID cuando viene precedido por el slug del nombre", () => {
    expect(extractIdFromSlug(`ramo-primavera-especial-${sampleUuid}`)).toBe(sampleUuid);
  });

  it("resuelve IDs locales conocidos como fallback", () => {
    expect(extractIdFromSlug("velvet-box")).toBe("velvet-box");
    expect(extractIdFromSlug("mi-producto-box-romantico")).toBe("box-romantico");
  });

  it("devuelve el mismo string si no coincide con UUID ni ID local", () => {
    expect(extractIdFromSlug("producto-personalizado")).toBe("producto-personalizado");
  });
});

describe("formatProductMarkdown", () => {
  it("convierte viñetas unicode (•, ·, ⁃) en guiones Markdown", () => {
    const raw = "Arreglo especial:\n• 24 rosas rojas\n· Peluche 20cm\n⁃ Tarjeta";
    const res = formatProductMarkdown(raw);
    expect(res).toContain("- 24 rosas rojas");
    expect(res).toContain("- Peluche 20cm");
    expect(res).toContain("- Tarjeta");
  });

  it("añade doble espacio al final de líneas normales para respetar saltos de línea suaves", () => {
    const raw = "Línea 1\nLínea 2";
    const res = formatProductMarkdown(raw);
    expect(res).toBe("Línea 1  \nLínea 2  ");
  });

  it("maneja texto vacío o nulo sin romperse", () => {
    expect(formatProductMarkdown("")).toBe("");
    expect(formatProductMarkdown(null)).toBe("");
    expect(formatProductMarkdown(undefined)).toBe("");
  });
});

describe("stripMarkdown", () => {
  it("remueve símbolos de formato y viñetas para meta tags limpios", () => {
    const md = "Hermoso arreglo:\n- 24 rosas rojas\n**Envío rápido**";
    const clean = stripMarkdown(md);
    expect(clean).toBe("Hermoso arreglo: 24 rosas rojas Envío rápido");
  });
});

describe("safeJsonLd", () => {
  it("escapa etiquetas </script> y símbolos HTML para impedir XSS en JSON-LD", () => {
    const out = safeJsonLd({ name: "Ramo </script><script>alert(1)</script> & Rosas" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script\\u003e");
    expect(out).toContain("\\u0026");
  });
});
