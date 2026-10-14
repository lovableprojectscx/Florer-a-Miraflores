import { test, expect, waitForHydration } from "./fixtures";

test.describe("Problema 4 — Tarjetas de producto 1:1 y carrusel de borde a borde", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("fm_popup_seen", "1"));
  });

  test("Escritorio 1440: primera tarjeta a <=16px del borde izquierdo, foto cuadrada 1:1 y se ven 4 completas", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Solo desktop");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await waitForHydration(page, "main");

    const novedades = page.locator("#novedades").first();
    await expect(novedades).toBeVisible();

    const cards = novedades.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();

    // Primera tarjeta empieza a <= 16px del borde izquierdo
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.x).toBeLessThanOrEqual(16);

    // Foto cuadrada 1:1 (tolerancia 2px)
    const img = firstCard.locator("img").first();
    await expect(img).toBeVisible();
    const imgBox = await img.boundingBox();
    expect(imgBox).not.toBeNull();
    const diff = Math.abs(imgBox!.width - imgBox!.height);
    expect(diff).toBeLessThanOrEqual(2);

    // Se ven 4 tarjetas completas dentro del viewport (1440px)
    const card1 = await cards.nth(0).boundingBox();
    const card2 = await cards.nth(1).boundingBox();
    const card3 = await cards.nth(2).boundingBox();
    const card4 = await cards.nth(3).boundingBox();

    expect(card1).not.toBeNull();
    expect(card2).not.toBeNull();
    expect(card3).not.toBeNull();
    expect(card4).not.toBeNull();

    expect(card1!.x + card1!.width).toBeLessThanOrEqual(1440);
    expect(card2!.x + card2!.width).toBeLessThanOrEqual(1440);
    expect(card3!.x + card3!.width).toBeLessThanOrEqual(1440);
    expect(card4!.x + card4!.width).toBeLessThanOrEqual(1440);

    // Si hay 5 o más tarjetas, la 5ª empieza dentro del viewport pero se corta (~4.2 visibles)
    if (count >= 5) {
      const card5 = await cards.nth(4).boundingBox();
      expect(card5).not.toBeNull();
      expect(card5!.x).toBeLessThan(1440);
      expect(card5!.x + card5!.width).toBeGreaterThan(1440);
    }

    // Paginación (1/N) y botón "Ver más productos"
    const contador = novedades.getByText(/\d+\s*\/\s*\d+/).first();
    await expect(contador).toBeVisible();
    expect(await contador.innerText()).toMatch(/1\s*\/\s*\d+/);

    const btnNext = novedades.locator('button[aria-label="Siguiente"]').first();
    await expect(btnNext).toBeVisible();
    await btnNext.click();
    await page.waitForTimeout(400);

    const verMasBtn = novedades.getByRole("link", { name: /ver más productos/i }).first();
    await expect(verMasBtn).toBeVisible();
    expect(await verMasBtn.getAttribute("href")).toContain("/tag/");
  });

  test("Escritorio 1920: primera tarjeta a <=16px, foto 1:1, ancho 430–470px y se ven 4 completas", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Solo desktop");
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await waitForHydration(page, "main");

    const novedades = page.locator("#novedades").first();
    await expect(novedades).toBeVisible();

    const cards = novedades.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();

    // Primera tarjeta a <= 16px
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.x).toBeLessThanOrEqual(16);

    // Foto cuadrada 1:1
    const img = firstCard.locator("img").first();
    await expect(img).toBeVisible();
    const imgBox = await img.boundingBox();
    expect(imgBox).not.toBeNull();
    const diff = Math.abs(imgBox!.width - imgBox!.height);
    expect(diff).toBeLessThanOrEqual(2);

    // Tarjeta mide 430–470px (~450px)
    expect(cardBox!.width).toBeGreaterThanOrEqual(430);
    expect(cardBox!.width).toBeLessThanOrEqual(470);

    // Se ven 4 tarjetas completas dentro del viewport (1920px)
    const card1 = await cards.nth(0).boundingBox();
    const card2 = await cards.nth(1).boundingBox();
    const card3 = await cards.nth(2).boundingBox();
    const card4 = await cards.nth(3).boundingBox();

    expect(card1).not.toBeNull();
    expect(card2).not.toBeNull();
    expect(card3).not.toBeNull();
    expect(card4).not.toBeNull();

    expect(card1!.x + card1!.width).toBeLessThanOrEqual(1920);
    expect(card2!.x + card2!.width).toBeLessThanOrEqual(1920);
    expect(card3!.x + card3!.width).toBeLessThanOrEqual(1920);
    expect(card4!.x + card4!.width).toBeLessThanOrEqual(1920);

    // Si hay 5 o más tarjetas, la 5ª empieza dentro del viewport pero se corta (~4.2 visibles)
    if (count >= 5) {
      const card5 = await cards.nth(4).boundingBox();
      expect(card5).not.toBeNull();
      expect(card5!.x).toBeLessThan(1920);
      expect(card5!.x + card5!.width).toBeGreaterThan(1920);
    }
  });

  test("Celular 390: se ven 2 tarjetas completas y parte de la tercera, foto 1:1", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "Solo desktop runner para fijar viewport 390 exacto",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await waitForHydration(page, "main");

    const novedades = page.locator("#novedades").first();
    await expect(novedades).toBeVisible();

    const cards = novedades.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const card1 = await cards.nth(0).boundingBox();
    const card2 = await cards.nth(1).boundingBox();
    const card3 = await cards.nth(2).boundingBox();

    expect(card1).not.toBeNull();
    expect(card2).not.toBeNull();
    expect(card3).not.toBeNull();

    // Primera tarjeta a <= 16px
    expect(card1!.x).toBeLessThanOrEqual(16);

    // Tarjeta 1 y 2 totalmente dentro del viewport (390px)
    expect(card1!.x + card1!.width).toBeLessThanOrEqual(390);
    expect(card2!.x + card2!.width).toBeLessThanOrEqual(390);

    // Tarjeta 3 empieza dentro pero se corta en el borde derecho
    expect(card3!.x).toBeLessThan(390);
    expect(card3!.x + card3!.width).toBeGreaterThan(390);

    // Foto 1:1
    const img1 = cards.nth(0).locator("img").first();
    const imgBox1 = await img1.boundingBox();
    expect(imgBox1).not.toBeNull();
    const diff = Math.abs(imgBox1!.width - imgBox1!.height);
    expect(diff).toBeLessThanOrEqual(2);
  });

  test("Catálogo: fotos de producto cuadradas 1:1 en ProductGrid", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Solo desktop");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/catalogo");
    await waitForHydration(page, "main");

    const firstProduct = page.locator("article").first();
    await expect(firstProduct).toBeVisible();

    const img = firstProduct.locator("img").first();
    await expect(img).toBeVisible();

    const imgBox = await img.boundingBox();
    expect(imgBox).not.toBeNull();
    const diff = Math.abs(imgBox!.width - imgBox!.height);
    expect(diff).toBeLessThanOrEqual(2);
  });
});
