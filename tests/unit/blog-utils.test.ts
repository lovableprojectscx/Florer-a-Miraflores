import { describe, it, expect } from "vitest";
import {
  slugifyBlog,
  isBlogPostVisible,
  getBlogPostStatus,
  validarBlogPostForm,
  formatBlogDate,
  calculateReadingTime,
  generateBlogPostingSchema,
} from "@/lib/blog-utils";
import type { BlogPostRow } from "@/types/database";

describe("blog-utils: slugifyBlog", () => {
  it("convierte títulos con tildes, mayúsculas y espacios en slugs limpios", () => {
    expect(slugifyBlog("Qué flores regalar en un aniversario")).toBe(
      "que-flores-regalar-en-un-aniversario",
    );
    expect(slugifyBlog("Significado de los colores de las rosas")).toBe(
      "significado-de-los-colores-de-las-rosas",
    );
    expect(slugifyBlog("Cómo cuidar tus tulipanes")).toBe("como-cuidar-tus-tulipanes");
  });

  it("convierte la letra eñe (ñ) en 'n'", () => {
    expect(slugifyBlog("Flores para fin de año y cumpleaños")).toBe(
      "flores-para-fin-de-ano-y-cumpleanos",
    );
  });

  it("elimina signos de interrogación, exclamación, dos puntos y caracteres especiales", () => {
    expect(slugifyBlog("¿Cuáles son las 5 mejores flores para mamá? ¡Descúbrelo!")).toBe(
      "cuales-son-las-5-mejores-flores-para-mama-descubrelo",
    );
    expect(slugifyBlog("Guía 2026: Arreglos florales & tulipanes")).toBe(
      "guia-2026-arreglos-florales-tulipanes",
    );
  });

  it("elimina guiones repetidos y guiones en los extremos", () => {
    expect(slugifyBlog("---Ramos---Especiales---")).toBe("ramos-especiales");
    expect(slugifyBlog("   espacios   multiples   ")).toBe("espacios-multiples");
  });

  it("retorna string vacío si el input es vacío o nulo", () => {
    expect(slugifyBlog("")).toBe("");
  });
});

describe("blog-utils: isBlogPostVisible y getBlogPostStatus", () => {
  const now = new Date("2026-10-14T20:00:00Z");

  it("retorna true solo si está publicado y la fecha es menor o igual a now", () => {
    expect(
      isBlogPostVisible({ publicado: true, fecha_publicacion: "2026-10-14T10:00:00Z" }, now),
    ).toBe(true);

    expect(
      isBlogPostVisible({ publicado: true, fecha_publicacion: "2026-10-14T20:00:00Z" }, now),
    ).toBe(true);
  });

  it("retorna false si está publicado pero con fecha futura (programado)", () => {
    expect(
      isBlogPostVisible({ publicado: true, fecha_publicacion: "2026-10-15T10:00:00Z" }, now),
    ).toBe(false);
  });

  it("retorna false si publicado es false (borrador), independientemente de la fecha", () => {
    expect(
      isBlogPostVisible({ publicado: false, fecha_publicacion: "2026-10-10T10:00:00Z" }, now),
    ).toBe(false);
  });

  it("calcula correctamente los tres estados: publicado, programado y borrador", () => {
    expect(
      getBlogPostStatus({ publicado: true, fecha_publicacion: "2026-10-10T10:00:00Z" }, now),
    ).toBe("publicado");

    expect(
      getBlogPostStatus({ publicado: true, fecha_publicacion: "2026-10-20T10:00:00Z" }, now),
    ).toBe("programado");

    expect(
      getBlogPostStatus({ publicado: false, fecha_publicacion: "2026-10-10T10:00:00Z" }, now),
    ).toBe("borrador");
  });
});

describe("blog-utils: validarBlogPostForm", () => {
  it("valida correctamente un artículo completo", () => {
    const res = validarBlogPostForm({
      titulo: "Cuidados para tulipanes holandeses",
      slug: "cuidados-para-tulipanes-holandeses",
      resumen: "Aprende a mantener tus tulipanes frescos por más de dos semanas.",
      contenido: "Los tulipanes requieren agua fría y un corte diagonal diario...",
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it("falla si falta el título o el contenido", () => {
    const res = validarBlogPostForm({
      titulo: "",
      slug: "articulo-sin-titulo",
      contenido: "",
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.titulo).toBeDefined();
    expect(res.errors.contenido).toBeDefined();
  });

  it("falla si el slug tiene formato inválido", () => {
    const res = validarBlogPostForm({
      titulo: "Título Válido",
      slug: "slug con espacios!",
      contenido: "Contenido válido de más de 10 caracteres.",
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.slug).toBeDefined();
  });
});

describe("blog-utils: formatBlogDate y calculateReadingTime", () => {
  it("formatea la fecha en español correctamente", () => {
    const formatted = formatBlogDate("2026-10-14T12:00:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/14 de octubre de 2026/i);
  });

  it("calcula el tiempo de lectura aproximado", () => {
    const shortText = "Una flor muy bonita para regalar.";
    expect(calculateReadingTime(shortText)).toBe(1);

    const longText = Array(450).fill("palabra").join(" ");
    expect(calculateReadingTime(longText)).toBe(3);
  });
});

describe("blog-utils: generateBlogPostingSchema", () => {
  it("genera el esquema JSON-LD BlogPosting con datos correctos", () => {
    const post: BlogPostRow = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      titulo: "Cómo cuidar tus tulipanes",
      slug: "como-cuidar-tus-tulipanes",
      resumen: "Consejos clave para tulipanes",
      contenido: "Contenido completo...",
      imagen_portada_url: "https://ejemplo.com/tulipanes.jpg",
      autor: "Florería Miraflores",
      categoria_relacionada_id: null,
      publicado: true,
      fecha_publicacion: "2026-10-14T10:00:00Z",
      meta_title: "Cuidado de tulipanes | Blog",
      meta_description: "Guía de cuidado de tulipanes en Lima",
      created_at: "2026-10-14T09:00:00Z",
      updated_at: "2026-10-14T09:00:00Z",
    };

    const schema = generateBlogPostingSchema({ post });
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.headline).toBe("Cuidado de tulipanes | Blog");
    expect(schema.description).toBe("Guía de cuidado de tulipanes en Lima");
    expect(schema.mainEntityOfPage["@id"]).toBe(
      "https://floreriamiraflores.com/blog/como-cuidar-tus-tulipanes",
    );
  });
});
