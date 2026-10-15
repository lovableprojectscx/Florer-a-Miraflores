import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ReactMarkdown from "react-markdown";

describe("Seguridad Markdown en Blog (Protección contra XSS)", () => {
  it("no renderiza elementos <script> en el DOM cuando se incluye HTML crudo", () => {
    const maliciousMarkdown = `
# Título del Artículo

Texto introductorio.

<script id="malicioso">window.__xss_executed = true;</script>

- Elemento de lista 1
- Elemento de lista 2
`;

    const { container } = render(
      <div className="prose">
        <ReactMarkdown>{maliciousMarkdown}</ReactMarkdown>
      </div>,
    );

    // 1. No debe existir ningún elemento script en el árbol renderizado
    const scriptTag = container.querySelector("script");
    expect(scriptTag).toBeNull();

    // 2. No debe haberse ejecutado código arbitrario
    expect((window as unknown as { __xss_executed?: boolean }).__xss_executed).toBeUndefined();
  });

  it("no ejecuta manejadores de eventos maliciosos inyectados como HTML crudo", () => {
    const maliciousImgMarkdown = `
# Prueba de imagen con onerror

<img src="invalido.jpg" onerror="window.__xss_img_executed = true" />
`;

    const { container } = render(
      <div className="prose">
        <ReactMarkdown>{maliciousImgMarkdown}</ReactMarkdown>
      </div>,
    );

    // Sin rehype-raw, las etiquetas HTML crudas se ignoran o se escapan como texto
    const imgWithOnError = container.querySelector("img[onerror]");
    expect(imgWithOnError).toBeNull();
    expect(
      (window as unknown as { __xss_img_executed?: boolean }).__xss_img_executed,
    ).toBeUndefined();
  });

  it("escapa correctamente el cierre de script en datos estructurados JSON-LD", () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: "</script><script>window.__xss_jsonld = true;</script>",
      description: "Prueba de inyección en metadata",
    };

    const serialized = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

    // No debe contener el literal "</script>" que cerraría prematuramente la etiqueta
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
    expect(serialized).toContain("\\u003cscript>");
  });
});
