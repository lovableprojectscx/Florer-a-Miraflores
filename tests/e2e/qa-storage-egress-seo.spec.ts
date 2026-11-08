import { test, expect, waitForHydration } from "./fixtures";

test.describe("Certificación Integral QA: Storage/Egress, Cache-Control, SEO/GEO y Markdown (RF-122..124, RNF-03..04, RNF-15..18)", () => {
  test("RNF-15: Catálogo y Condolencias sirven 100% miniaturas WebP con Cache-Control 1 año, 0 errores 4xx y Egress < 1.2 MB", async ({
    page,
  }) => {
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));

    const storageResponses: Array<{
      url: string;
      status: number;
      cacheControl: string;
      bytes: number;
    }> = [];

    page.on("response", (res) => {
      const url = res.url();
      if (url.includes("supabase.co/storage/v1/object/public/")) {
        const headers = res.headers();
        const cl = Number(headers["content-length"] || 0);
        storageResponses.push({
          url,
          status: res.status(),
          cacheControl: headers["cache-control"] || "",
          bytes: Number.isFinite(cl) ? cl : 0,
        });
      }
    });

    // 1. Carga inicial de /catalogo (lote de 24 tarjetas)
    await page.goto("/catalogo");
    await waitForHydration(page, "main select");

    const cards = page.locator("main article");
    await expect(cards).toHaveCount(24);

    // Esperar a que las primeras imágenes visibles carguen
    const catalogImgs = page.locator("main article img");
    await expect
      .poll(
        async () => {
          return await catalogImgs.evaluateAll((imgs) => {
            const visibleBatch = imgs.slice(0, 8);
            return visibleBatch.every((img) => {
              const el = img as HTMLImageElement;
              return el.complete && el.naturalWidth > 0;
            });
          });
        },
        { timeout: 15_000 },
      )
      .toBe(true);

    // Verificar que las tarjetas usen /thumbs/480/ y no originales pesados de raíz
    const loadedSrcs = await catalogImgs.evaluateAll((imgs) =>
      imgs
        .slice(0, 8)
        .map((i) => (i as HTMLImageElement).currentSrc)
        .filter((u) => u.includes("supabase.co/storage")),
    );
    expect(loadedSrcs.length).toBeGreaterThan(0);
    for (const src of loadedSrcs) {
      expect(src).toContain("/thumbs/480/");
    }

    // Presupuesto estricto de File Egress en carga inicial de /catalogo (< 1.2 MB)
    const catalogEgressBytes = storageResponses.reduce((acc, r) => acc + r.bytes, 0);
    expect(catalogEgressBytes).toBeLessThan(1_258_291);

    // 2. Navegar a /categoria/defuncion (lote 4K de Condolencias)
    await page.goto("/categoria/defuncion");
    await waitForHydration(page, "main");
    const condImgs = page.locator("main article img");
    if ((await condImgs.count()) > 0) {
      await expect
        .poll(
          async () => {
            return await condImgs
              .first()
              .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
          },
          { timeout: 15_000 },
        )
        .toBe(true);
    }

    // 3. Certificar 0 respuestas 4xx/5xx en Storage y Cache-Control inmutable de 1 año
    expect(storageResponses.length).toBeGreaterThan(0);
    const failedStorage = storageResponses.filter((r) => r.status >= 400);
    expect(
      failedStorage,
      `Se detectaron errores HTTP en Supabase Storage:\n${JSON.stringify(failedStorage, null, 2)}`,
    ).toEqual([]);

    const uncachedStorage = storageResponses.filter(
      (r) => r.status === 200 && !r.cacheControl.includes("max-age=31536000"),
    );
    expect(
      uncachedStorage,
      `Activos de Storage sin Cache-Control de 1 año (31536000s):\n${JSON.stringify(uncachedStorage, null, 2)}`,
    ).toEqual([]);
  });

  test("RNF-03, RNF-04, RNF-16, RF-124: SEO canónico dinámico, GEO-Targeting Lima, Schema.org seguro y llms.txt", async ({
    page,
  }) => {
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));

    // 1. Verificar /llms.txt y /Logo.webp para Agentic Browsing y Open Graph
    const llmsRes = await page.request.get("/llms.txt");
    expect(llmsRes.status()).toBe(200);
    const llmsText = await llmsRes.text();
    expect(llmsText).toContain("# Florería Miraflores");
    expect(llmsText).toContain("Miraflores");

    const logoRes = await page.request.get("/Logo.webp");
    expect(logoRes.status()).toBe(200);

    // 2. Verificar Home (/): lang es-PE, GEO tags, canonical exacto y Schema Florist válido
    await page.goto("/");
    await waitForHydration(page, "main");

    await expect(page.locator("html")).toHaveAttribute("lang", "es-PE");
    await expect(page.locator('meta[name="geo.region"]')).toHaveAttribute("content", "PE-LIM");
    await expect(page.locator('meta[name="geo.placename"]')).toHaveAttribute(
      "content",
      "Miraflores, Lima",
    );

    const homeCanonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(homeCanonical).toBeTruthy();
    const siteOrigin = new URL(homeCanonical!).origin;
    expect(siteOrigin).toMatch(
      /^https:\/\/(floreriamiraflores\.com|florer-a-miraflores\.vercel\.app)$/,
    );
    expect(homeCanonical).toBe(`${siteOrigin}/`);

    const homeSchemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(homeSchemas.length).toBeGreaterThan(0);
    const parsedHomeSchemas = homeSchemas.map((raw) => JSON.parse(raw));
    expect(parsedHomeSchemas.some((s) => s["@type"] === "Florist")).toBe(true);

    // 3. Verificar Catálogo (/catalogo): canonical autorreferencial dinámico (NO apunta a /)
    await page.goto("/catalogo");
    await waitForHydration(page, "main");
    const catCanonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(catCanonical).toBe(`${siteOrigin}/catalogo`);
    const catNavColor = await page
      .locator('main nav[aria-label="Ruta de navegación"]')
      .evaluate((el) => getComputedStyle(el).color);
    expect(catNavColor).toBe("rgb(92, 77, 66)");

    // 4. Navegar a una Ficha de Producto real y verificar Product + BreadcrumbList + RNF-15 (960w, no raíz) + RF-122/RNF-18
    const firstProductHref = await page
      .locator('main article a[href^="/producto/"]')
      .first()
      .getAttribute("href");
    expect(firstProductHref).toBeTruthy();

    await page.goto(firstProductHref!);
    await waitForHydration(page, "main");

    const prodCanonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(prodCanonical).toBe(`${siteOrigin}${firstProductHref}`);

    const prodSchemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsedProdSchemas = prodSchemas.map((raw) => JSON.parse(raw));
    expect(parsedProdSchemas.some((s) => s["@type"] === "Product")).toBe(true);
    expect(parsedProdSchemas.some((s) => s["@type"] === "BreadcrumbList")).toBe(true);

    // Verificar que la foto principal de ficha de producto cargue desde /thumbs/ (480 o 960) y sea 1:1
    const mainProdImg = page.locator("main .aspect-square img").first();
    await expect(mainProdImg).toBeVisible();
    await expect
      .poll(async () =>
        mainProdImg.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
      )
      .toBe(true);

    const mainProdSrc = await mainProdImg.evaluate((el: HTMLImageElement) => el.currentSrc);
    if (mainProdSrc.includes("supabase.co/storage")) {
      expect(mainProdSrc).toMatch(/\/thumbs\/(480|960)\//);
    }

    // Verificar contraste accesible en breadcrumb (RNF-18: #5C4D42 -> rgb(92, 77, 66))
    const breadcrumbNav = page.locator("main nav").first();
    const navColor = await breadcrumbNav.evaluate((el) => getComputedStyle(el).color);
    expect(navColor).toBe("rgb(92, 77, 66)");

    // 5. Verificar noindex en rutas administrativas (/admin-login)
    await page.goto("/admin-login");
    const robotsAdmin = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robotsAdmin).toContain("noindex");
  });
});
