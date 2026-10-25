import { describe, expect, it } from "vitest";
import { resolveCacheControl } from "../../api/index.js";

describe("Reglas de Caché Edge en Vercel (resolveCacheControl en api/index.js)", () => {
  it("GET / asigna cabecera s-maxage=120 y stale-while-revalidate=600 para absorber tráfico en CDN", () => {
    const cacheHeader = resolveCacheControl("/", "GET", 200);
    expect(cacheHeader).toBe("public, s-maxage=120, stale-while-revalidate=600");
  });

  it("HEAD / también recibe cabecera pública de Edge CDN", () => {
    const cacheHeader = resolveCacheControl("/", "HEAD", 200);
    expect(cacheHeader).toBe("public, s-maxage=120, stale-while-revalidate=600");
  });

  it("GET /catalogo y páginas públicas de catálogo/categorías/productos se cachean en el Edge", () => {
    const rutasPublicas = [
      "/catalogo",
      "/categoria/ramos",
      "/categoria/rosas/premium",
      "/producto/ramo-primavera-123",
      "/nosotros",
      "/recuerdos",
      "/resenas",
      "/blog",
      "/terminos",
      "/privacidad",
    ];

    for (const ruta of rutasPublicas) {
      const header = resolveCacheControl(ruta, "GET", 200);
      expect(header).toBe("public, s-maxage=120, stale-while-revalidate=600");
    }
  });

  it("Rutas administrativas (/admin, /admin/...) son estrictamente privadas y nunca se cachean", () => {
    const rutasAdmin = [
      "/admin",
      "/admin-login",
      "/admin/productos",
      "/admin/banners",
      "/admin/config",
      "/api/admin/metricas",
    ];

    for (const ruta of rutasAdmin) {
      const header = resolveCacheControl(ruta, "GET", 200);
      expect(header).toBe("private, no-cache, no-store, must-revalidate");
    }
  });

  it("Rutas transaccionales (/checkout, /confirmacion) son estrictamente privadas", () => {
    const rutasPrivadas = ["/checkout", "/confirmacion"];

    for (const ruta of rutasPrivadas) {
      const header = resolveCacheControl(ruta, "GET", 200);
      expect(header).toBe("private, no-cache, no-store, must-revalidate");
    }
  });

  it("Peticiones POST nunca se cachean en CDN", () => {
    const header = resolveCacheControl("/api/pedidos", "POST", 200);
    expect(header).toBe("private, no-cache, no-store, must-revalidate");
  });

  it("Respuestas de error (500, 404) nunca se cachean públicamente", () => {
    const header500 = resolveCacheControl("/", "GET", 500);
    expect(header500).toBe("private, no-cache, no-store, must-revalidate");
  });
});
