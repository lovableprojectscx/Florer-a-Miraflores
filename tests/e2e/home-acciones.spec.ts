import { test, expect, waitForHydration } from "./fixtures";

test.describe("Home E2E — Acciones rápidas en tarjetas (RF-017 / RF-018)", () => {
  test.beforeEach(async ({ context, page }) => {
    // Otorgar permisos de portapapeles para probar la acción de copiar enlace
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    // Evitar que el popup automático intercepte eventos de puntero durante la prueba
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("fm_popup_seen", "1");
        localStorage.setItem("fm_subscribed", "true");
      } catch {
        // no-op
      }
    });
  });

  test("RF-017: Botón 'Agregar al carrito' agrega producto y abre el drawer sin navegar", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page, "main");

    // Buscar una tarjeta con botón 'Agregar al carrito'
    const btnAgregar = page.locator('button[title="Agregar al carrito"]').first();
    await expect(btnAgregar).toBeVisible();

    // Obtener el nombre del producto en esa tarjeta
    const card = btnAgregar.locator("xpath=ancestor::article[1]");
    const productTitle = (await card.locator("h3").innerText()).trim();

    // Clic en agregar
    await btnAgregar.click();

    // Debe permanecer en el home ('/')
    expect(new URL(page.url()).pathname).toBe("/");

    // El drawer del carrito debe abrirse y mostrar el producto agregado
    const drawer = page.locator('[role="dialog"], aside, div').filter({
      hasText: /Tu Carrito|Carrito de compras/i,
    });
    await expect(drawer.first()).toBeVisible();

    // El producto debe estar dentro del carrito
    const itemEnCarrito = page.getByText(productTitle);
    await expect(itemEnCarrito.first()).toBeVisible();
  });

  test("RF-018: Botón 'Compartir' copia la URL del producto al portapapeles", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page, "main");

    const btnShare = page.locator('button[aria-label="Compartir producto"]').first();
    await expect(btnShare).toBeVisible();

    // Clic en compartir
    await btnShare.click();

    // Indicador visual de copiado
    await expect(btnShare.getByText("¡Copiado!")).toBeVisible();

    // Verificar contenido del portapapeles
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("/producto/");
  });
});
