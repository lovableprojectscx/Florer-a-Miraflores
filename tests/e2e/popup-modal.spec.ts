import { test, expect } from "./fixtures";

test.describe("Popup Modal Club Florería Miraflores — Opción A (Horizontal Compacto)", () => {
  const mockPopupConImagen = [
    {
      id: "popup-e2e-test",
      activo: true,
      texto: null,
      imagen_url:
        "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
      fecha_expiracion: null,
    },
  ];

  test("Desktop/Laptop: renderiza en 2 columnas (horizontal) con altura contenida <= 450px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Mock de API para asegurar popup activo
    await page.route("**/rest/v1/popup*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPopupConImagen),
      });
    });

    // Reducir delay a 100ms solo para acelerar la prueba
    await page.addInitScript(() => {
      (window as unknown as { __POPUP_DELAY__: number }).__POPUP_DELAY__ = 100;
    });

    await page.goto("/");

    const modal = page.locator('[data-testid="popup-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const card = page.locator('[data-testid="popup-card"]');
    await expect(card).toBeVisible();

    // Medir dimensiones del modal en laptop (1280x720)
    const cardBox = await card.boundingBox();
    expect(cardBox).not.toBeNull();
    if (cardBox) {
      // El modal no debe saturar la laptop: altura <= 450px (menos del 60% de 720px)
      expect(cardBox.height).toBeLessThanOrEqual(450);
      // El ancho en desktop debe ser estilo horizontal (~672px max-w-2xl)
      expect(cardBox.width).toBeGreaterThanOrEqual(500);
      expect(cardBox.width).toBeLessThanOrEqual(720);
    }

    // Verificar layout de 2 columnas (flex-direction: row en md)
    const flexDirection = await card.evaluate((el) => {
      return window.getComputedStyle(el).flexDirection;
    });
    expect(flexDirection).toBe("row");

    // Verificar presencia de elementos clave
    const img = card.locator('img[alt="Club Florería Miraflores"]');
    await expect(img).toBeVisible();

    const nameInput = page.locator("#subscriber-name-input");
    const phoneInput = page.locator("#subscriber-phone-input");
    const consentCheckbox = page.locator("#consent-checkbox");
    const submitBtn = card.locator('button[type="submit"]');

    await expect(nameInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(consentCheckbox).toBeVisible();
    await expect(consentCheckbox).not.toBeChecked();
    await expect(submitBtn).toBeVisible();

    // Probar cierre con la 'X' y persistencia en sessionStorage
    const closeBtn = page.locator('[data-testid="popup-close-button"]');
    await closeBtn.click();
    await expect(modal).not.toBeVisible();

    const seenStorage = await page.evaluate(() => sessionStorage.getItem("fm_popup_seen"));
    expect(seenStorage).toBe("1");
  });

  test("Mobile: layout compacto vertical sin desbordar ni provocar scroll horizontal", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.route("**/rest/v1/popup*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPopupConImagen),
      });
    });

    await page.addInitScript(() => {
      (window as unknown as { __POPUP_DELAY__: number }).__POPUP_DELAY__ = 100;
    });

    await page.goto("/");

    const modal = page.locator('[data-testid="popup-modal"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    const card = page.locator('[data-testid="popup-card"]');
    await expect(card).toBeVisible();

    // En móvil debe ser flex column
    const flexDirection = await card.evaluate((el) => {
      return window.getComputedStyle(el).flexDirection;
    });
    expect(flexDirection).toBe("column");

    // Sin scroll horizontal en la ventana
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Validación inline al enviar vacío
    const submitBtn = card.locator('button[type="submit"]');
    await submitBtn.click();

    // Debe mostrar mensaje de error de validación
    const errorText = card.getByText(/Por favor ingresa tu nombre/i);
    await expect(errorText).toBeVisible();
  });

  test("Retardo no invasivo: NO se abre de inmediato (respeta temporizador default de 8s)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.route("**/rest/v1/popup*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockPopupConImagen),
      });
    });

    // Limpiar sessionStorage antes de cargar
    await page.addInitScript(() => {
      sessionStorage.removeItem("fm_popup_seen");
      localStorage.removeItem("fm_subscribed");
    });

    await page.goto("/");

    // A los 1500ms NO debe haberse abierto (antiguo popup abría a los 3s, el nuevo espera 8s)
    await page.waitForTimeout(1500);

    const modal = page.locator('[data-testid="popup-modal"]');
    const isVisibleAt1500ms = await modal.isVisible();
    expect(isVisibleAt1500ms).toBe(false);
  });
});
