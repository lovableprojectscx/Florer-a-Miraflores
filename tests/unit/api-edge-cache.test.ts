import { describe, expect, it } from "vitest";
import { resolveCacheControl } from "../../api/index.js";

describe("Reglas de Caché Edge en Vercel (resolveCacheControl en api/index.js)", () => {
  it("GET / asigna cabecera s-maxage=300 y stale-while-revalidate=86400 para absorber tráfico en CDN", () => {
    const cacheHeader = resolveCacheControl("/", "GET", 200);
    expect(cacheHeader).toBe("public, s-maxage=300, stale-while-revalidate=86400");
  });

  it("HEAD / también recibe cabecera pública de Edge CDN", () => {
    const cacheHeader = resolveCacheControl("/", "HEAD", 200);
    expect(cacheHeader).toBe("public, s-maxage=300, stale-while-revalidate=86400");
  });

  it("GET /catalogo y páginas públicas de catálogo/categorías/productos se cachean en el Edge", () => {
    const headerCatalogo = resolveCacheControl("/catalogo", "GET", 200);
    expect(headerCatalogo).toBe("public, s-maxage=180, stale-while-revalidate=86400");

    const rutasPublicas = [
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
      expect(header).toBe("public, s-maxage=300, stale-while-revalidate=86400");
    }
  });

  it("Peticiones con cookies de autenticación o tokens de administrador nunca se cachean en CDN", () => {
    const headerCookie = resolveCacheControl("/categoria/ocasion/amor-aniversario", "GET", 200, {
      cookie: "sb-sdrkiomeesoctsxeidmu-auth-token=xyz; other=123",
    });
    expect(headerCookie).toBe("private, no-cache, no-store, must-revalidate");

    const headerAuth = resolveCacheControl("/catalogo", "GET", 200, {
      authorization: "Bearer test-admin-token",
    });
    expect(headerAuth).toBe("private, no-cache, no-store, must-revalidate");
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

  it("Peticiones con parámetros de bypass (preview=, nocache=, v=, t=) nunca se cachean en CDN", () => {
    const rutasConBypass = [
      "/producto/ramo-primavera-123?preview=1",
      "/producto/ramo-primavera-123?nocache=1",
      "/producto/ramo-primavera-123?v=1730665000",
      "/producto/ramo-primavera-123?t=1730665000",
      "/?preview=1",
    ];

    for (const ruta of rutasConBypass) {
      const header = resolveCacheControl(ruta, "GET", 200);
      expect(header).toBe("private, no-cache, no-store, must-revalidate");
    }
  });
});
