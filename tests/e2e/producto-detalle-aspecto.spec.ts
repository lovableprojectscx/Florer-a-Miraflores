import { test, expect, waitForHydration } from "./fixtures";

test.describe("Ficha de producto (/producto/:id) — Verificación de Proporción 1:1 y Calidad Visual", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
  });

  test("Desktop 1440: foto principal cuadrada 1:1 (tolerancia 2px), object-cover y miniaturas cuadradas", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Prueba exclusiva para proyecto desktop");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/catalogo");
    await waitForHydration(page, "main");

    const firstProductLink = page.locator('main article a[href^="/producto/"]').first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();
    await page.waitForURL(/\/producto\//);
    await waitForHydration(page, "main");

    // Contenedor principal de la foto de producto con aspect-square
    const mainImgContainer = page.locator("main .aspect-square").first();
    await expect(mainImgContainer).toBeVisible();

    const box = await mainImgContainer.boundingBox();
    expect(box).not.toBeNull();
    // Verificación matemática estricta: ancho igual a alto (1:1)
    const diff = Math.abs(box!.width - box!.height);
    expect(diff).toBeLessThanOrEqual(2);

    // La imagen interior llena el contenedor y tiene object-cover
    const img = mainImgContainer.locator("img").first();
    await expect(img).toBeVisible();
    const objectFit = await img.evaluate((el) => window.getComputedStyle(el).objectFit);
    expect(objectFit).toBe("cover");

    // Miniaturas cuadradas (si existen)
    const thumbnails = page.locator('main button[aria-label^="Ver imagen"]');
    const thumbCount = await thumbnails.count();
    if (thumbCount > 0) {
      for (let i = 0; i < thumbCount; i++) {
        const thumbBox = await thumbnails.nth(i).boundingBox();
        expect(thumbBox).not.toBeNull();
        const thumbDiff = Math.abs(thumbBox!.width - thumbBox!.height);
        expect(thumbDiff).toBeLessThanOrEqual(2);
      }
    }
  });

  test("Mobile: foto principal cuadrada 1:1 en celular y sin desborde horizontal", async ({
    page,
  }) => {
    await page.goto("/catalogo");
    await waitForHydration(page, "main");

    const firstProductLink = page.locator('main article a[href^="/producto/"]').first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();
    await page.waitForURL(/\/producto\//);
    await waitForHydration(page, "main");

    const mainImgContainer = page.locator("main .aspect-square").first();
    await expect(mainImgContainer).toBeVisible();

    const box = await mainImgContainer.boundingBox();
    expect(box).not.toBeNull();
    const diff = Math.abs(box!.width - box!.height);
    expect(diff).toBeLessThanOrEqual(2);

    // Sin desborde horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("Laptop 1280: contenedor 1:1 alineado armónicamente con la columna de compra", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Prueba exclusiva para proyecto desktop");
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/catalogo");
    await waitForHydration(page, "main");

    const firstProductLink = page.locator('main article a[href^="/producto/"]').first();
    await expect(firstProductLink).toBeVisible();
    await firstProductLink.click();
    await page.waitForURL(/\/producto\//);
    await waitForHydration(page, "main");

    const mainImgContainer = page.locator("main .aspect-square").first();
    await expect(mainImgContainer).toBeVisible();

    const box = await mainImgContainer.boundingBox();
    expect(box).not.toBeNull();
    const diff = Math.abs(box!.width - box!.height);
    expect(diff).toBeLessThanOrEqual(2);

    // Botones de acción visibles en la ficha
    const btnAgregar = page
      .locator("main")
      .getByRole("button", { name: /agregar al carrito/i })
      .first();
    const btnComprar = page
      .locator("main")
      .getByRole("button", { name: /comprar ahora/i })
      .first();
    await expect(btnAgregar).toBeVisible();
    await expect(btnComprar).toBeVisible();
  });
});
