import { test, expect, waitForHydration } from "./fixtures";
import { resolve } from "node:path";

test.describe("Miniaturas y Responsive Images E2E (Fase 06-B)", () => {
  test("Home: Novedades y Categorías configuran URLs de miniaturas y srcSet con thumbs/", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page, "main");

    // 1. Carrusel de Novedades
    const novedades = page.locator("#novedades");
    await expect(novedades).toBeVisible();
    const novedadesImgs = novedades.locator("img");
    await expect(novedadesImgs.first()).toBeVisible();

    const rawSrc =
      (await novedadesImgs.first().getAttribute("data-thumb-src")) ||
      (await novedadesImgs.first().getAttribute("src"));
    const rawSrcSet =
      (await novedadesImgs.first().getAttribute("data-thumb-srcset")) ||
      (await novedadesImgs.first().getAttribute("srcset"));

    // Verificar que apunta a miniaturas thumbs/480/ o render/ si es URL de storage
    if (rawSrc && rawSrc.includes("supabase.co/storage")) {
      expect(rawSrc).toMatch(/(thumbs\/480|render\/)/);
      expect(rawSrcSet).toMatch(/thumbs\/480.+480w.+thumbs\/960.+960w/);
    }

    // 2. Colecciones en Categorías
    const categorias = page.locator("#categorias");
    if ((await categorias.count()) > 0) {
      const catImgs = categorias.locator("img");
      await expect(catImgs.first()).toBeVisible();
      const catFirstSrc =
        (await catImgs.first().getAttribute("data-thumb-src")) ||
        (await catImgs.first().getAttribute("src"));
      if (catFirstSrc && catFirstSrc.includes("supabase.co/storage")) {
        expect(catFirstSrc).toMatch(/(thumbs\/(480|960)|render\/)/);
      }
    }
  });

  test("Catálogo: productos cargan miniaturas 480w y srcSet responsive", async ({ page }) => {
    await page.goto("/catalogo");
    await waitForHydration(page, "main select");

    const cards = page.locator("main article");
    await expect(cards.first()).toBeVisible();

    const firstImg = cards.first().locator("img");
    await expect(firstImg).toBeVisible();

    const rawCatalogSrc =
      (await firstImg.getAttribute("data-thumb-src")) || (await firstImg.getAttribute("src"));
    const rawCatalogSrcSet =
      (await firstImg.getAttribute("data-thumb-srcset")) || (await firstImg.getAttribute("srcset"));

    if (rawCatalogSrc && rawCatalogSrc.includes("supabase.co/storage")) {
      expect(rawCatalogSrc).toMatch(/(thumbs\/480|render\/)/);
      expect(rawCatalogSrcSet).toMatch(/thumbs\/480.+480w.+thumbs\/960.+960w/);
    }
  });

  test("Demostración de Fallback (Punto 2): bloqueo 404 en /thumbs/ en Home y Catálogo recupera todas las imágenes originales con naturalWidth > 0", async ({
    page,
    allowConsoleErrors,
  }, testInfo) => {
    // Permitir los errores 404 intencionales simulados de miniaturas
    allowConsoleErrors([/thumbs/i]);

    // Prevenir modal emergente durante la prueba y captura
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));

    // Bloquear TODAS las peticiones que contengan /thumbs/ simulando 404 del CDN
    await page.route("**/thumbs/**", (route) => {
      route.fulfill({
        status: 404,
        contentType: "text/plain",
        body: "Not Found (Simulated CDN 404)",
      });
    });

    // ── 1. Verificación en Home (/) ──
    await page.goto("/");
    await waitForHydration(page, "main");

    const novedades = page.locator("#novedades");
    await expect(novedades).toBeVisible();
    await novedades.scrollIntoViewIfNeeded();

    const visibleNovedadesImgs = novedades.locator("img");
    const novCount = await visibleNovedadesImgs.count();
    expect(novCount).toBeGreaterThan(0);

    // Esperar a que las primeras tarjetas visibles de Novedades apliquen fallback y carguen
    await expect
      .poll(
        async () => {
          return await visibleNovedadesImgs.evaluateAll((imgs) => {
            const batch = imgs.slice(0, 4);
            return batch.every((img) => {
              const el = img as HTMLImageElement;
              return el.complete && el.naturalWidth > 0 && !el.currentSrc.includes("/thumbs/");
            });
          });
        },
        { timeout: 15_000 },
      )
      .toBe(true);

    // Capturar novedades con fallback activo y fotos completamente visibles
    if (testInfo.project.name === "mobile") {
      const outPath390 = resolve("docs/evidencias/fase-06b/novedades-390-despues.png");
      await novedades.screenshot({ path: outPath390 });
    } else if (testInfo.project.name === "desktop") {
      const outPath1440 = resolve("docs/evidencias/fase-06b/novedades-1440-despues.png");
      await novedades.screenshot({ path: outPath1440 });
    }

    // ── 2. Verificación en Catálogo (/catalogo) ──
    await page.goto("/catalogo");
    await waitForHydration(page, "main select");

    const cards = page.locator("main article");
    await expect(cards).toHaveCount(24);

    const catalogImgs = page.locator("main article img");
    await expect(catalogImgs).toHaveCount(24);

    // Scroll progresivo para asegurar que el viewport active las imágenes
    for (let i = 0; i < 24; i++) {
      await cards.nth(i).scrollIntoViewIfNeeded();
      if (i % 4 === 0) {
        await page.waitForTimeout(50);
      }
    }

    // Esperar a que todas las 24 imágenes terminen con naturalWidth > 0 y currentSrc sin /thumbs/
    await expect
      .poll(
        async () => {
          return await catalogImgs.evaluateAll((imgs) => {
            return imgs.filter((img) => {
              const el = img as HTMLImageElement;
              return el.complete && el.naturalWidth > 0 && !el.currentSrc.includes("/thumbs/");
            }).length;
          });
        },
        { timeout: 20_000 },
      )
      .toBe(24);
  });

  test("Banner Hero: en desktop 1440 carga original sin /thumbs/, en mobile 390 carga sin errores (Fase 06-C)", async ({
    page,
  }, testInfo) => {
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
    await page.goto("/");
    await waitForHydration(page, "main");

    const heroSection = page.locator("section.w-full.bg-white").first();
    await expect(heroSection).toBeVisible();

    const bannerImg = heroSection.locator("img").first();
    await expect(bannerImg).toBeVisible();

    // Esperar a que la imagen complete su carga
    await expect
      .poll(async () => {
        return await bannerImg.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        );
      })
      .toBe(true);

    const currentSrc = await bannerImg.evaluate((img: HTMLImageElement) => img.currentSrc);

    if (testInfo.project.name === "desktop") {
      // En desktop 1440 el navegador selecciona el candidato original (2560w), sin /thumbs/
      expect(currentSrc).not.toContain("/thumbs/");
      const domNaturalWidth = await bannerImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
      const naturalWidth = await bannerImg.evaluate(async (img: HTMLImageElement) => {
        const probe = new Image();
        probe.src = img.currentSrc;
        await probe.decode();
        return probe.naturalWidth;
      });
      console.log(
        `[E2E desktop 1440] Banner activo domNaturalWidth (density-corrected): ${domNaturalWidth}`,
      );
      console.log(
        `[E2E desktop 1440] Banner activo naturalWidth (original cargado): ${naturalWidth}`,
      );
      expect(naturalWidth).toBe(2560);
    } else {
      // En mobile 390 el banner carga correctamente con dimensiones naturales > 0 sin error
      const naturalWidth = await bannerImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test("Fase 06-H: En desktop 1920 y 1440 las fotos con zoom de Novedades cargan /960/ o original, nunca /480/", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name !== "desktop") {
      test.skip(true, "Prueba exclusiva para escritorio");
      return;
    }

    // 1. En 1440x900 (viewport por defecto de proyecto desktop)
    await page.goto("/");
    await waitForHydration(page, "main");

    const imgSelector = "#novedades img, section[id^='tag-'] img";
    const firstImg = page.locator(imgSelector).first();
    await expect(firstImg).toBeVisible();

    await expect
      .poll(async () => {
        return await firstImg.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        );
      })
      .toBe(true);

    const currentSrc1440 = await firstImg.evaluate((img: HTMLImageElement) => img.currentSrc);
    console.log(`[Fase 06-H 1440] currentSrc: ${currentSrc1440}`);
    expect(currentSrc1440).not.toContain("/thumbs/480/");
    if (currentSrc1440.includes("supabase.co/storage")) {
      expect(currentSrc1440).toMatch(/(thumbs\/960\/|[^/]+\.webp)/);
    }

    // 2. En 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(400);

    const currentSrc1920 = await firstImg.evaluate((img: HTMLImageElement) => img.currentSrc);
    console.log(`[Fase 06-H 1920] currentSrc: ${currentSrc1920}`);
    expect(currentSrc1920).not.toContain("/thumbs/480/");
    if (currentSrc1920.includes("supabase.co/storage")) {
      expect(currentSrc1920).toMatch(/(thumbs\/960\/|[^/]+\.webp)/);
    }
  });
});
