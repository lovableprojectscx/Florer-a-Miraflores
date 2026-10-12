import { test, expect, waitForHydration } from "./fixtures";

function getSafeFutureDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
}

test.describe("Checkout E2E — Flujo completo con interceptación segura", () => {
  test("carrito vacío redirige automáticamente a /", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/$/);
  });

  test("muestra errores inline al enviar vacío, suma delivery al elegir distrito y completa pedido interceptado hacia /confirmacion", async ({
    page,
  }) => {
    let interceptedCount = 0;

    // Regla de oro: interceptar SIEMPRE el POST a pedidos para no crear datos reales en producción
    await page.route("**/rest/v1/pedidos*", async (route) => {
      if (route.request().method() === "POST") {
        interceptedCount++;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    // 1. Agregar producto desde /catalogo e ir al checkout
    await page.goto("/catalogo");
    await waitForHydration(page, "main article button");

    const firstCard = page.locator("main article").first();
    await expect(firstCard).toBeVisible();
    await firstCard.getByRole("button", { name: /agregar al carrito/i }).click();

    const drawer = page.getByRole("dialog", { name: "Carrito de compras" });
    await expect(drawer).toHaveClass(/translate-x-0/);
    await drawer.getByRole("link", { name: /Continuar al checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    // 2. Enviar formulario vacío → errores inline
    const form = page.locator("form");
    const submitBtn = form.getByRole("button", { name: /Pagar con IZIPay/i });
    await submitBtn.click();

    await expect(form.getByText("Ingresa tu nombre completo")).toBeVisible();
    await expect(form.getByText("El teléfono debe tener al menos 9 dígitos")).toBeVisible();
    await expect(form.getByText("Ingresa un email válido")).toBeVisible();
    await expect(form.getByText("Selecciona un distrito")).toBeVisible();
    await expect(form.getByText("Ingresa tu dirección completa")).toBeVisible();
    await expect(form.getByText("Selecciona una fecha de entrega")).toBeVisible();
    await expect(form.getByText("Selecciona una hora de entrega")).toBeVisible();

    // 3. Elegir distrito suma el delivery al total
    const summaryAside = page.locator("aside");
    const subtotalText = await summaryAside
      .locator("div")
      .filter({ hasText: /^SubtotalS\// })
      .first()
      .innerText();
    const subtotalMatch = subtotalText.match(/S\/\s*([\d.]+)/);
    const subtotalVal = subtotalMatch ? Number(subtotalMatch[1]) : 0;
    expect(subtotalVal).toBeGreaterThan(0);

    const distritoSelect = page.locator("#distrito_id");
    await distritoSelect.selectOption({ index: 1 });
    const selectedOptionText = await distritoSelect.locator("option:checked").innerText();
    const deliveryMatch = selectedOptionText.match(/S\/\s*([\d.]+)/);
    const deliveryVal = deliveryMatch ? Number(deliveryMatch[1]) : 10;

    const expectedTotal = (subtotalVal + deliveryVal).toFixed(2);
    await expect(submitBtn).toContainText(`S/ ${expectedTotal} PEN`);

    // 4. Completar campos válidos y enviar
    await page.locator("#nombre").fill("Cliente Prueba E2E");
    await page.locator("#telefono").fill("999888777");
    await page.locator("#email").fill("e2e@floreriamiraflores.com");
    await page.locator("#direccion").fill("Av. Larco 1234, Miraflores");
    await page.locator("#fecha_entrega").fill(getSafeFutureDate());
    await page.locator("#hora_entrega").selectOption("manana");

    await submitBtn.click();

    // Verificar que la interceptación de red ocurrió (0 escrituras en BD real)
    await expect.poll(() => interceptedCount).toBe(1);

    // Modal de pedido registrado -> clic en "Ver resumen del pedido" para ir a /confirmacion
    await expect(page.getByRole("heading", { name: "¡Pedido registrado!" })).toBeVisible();
    await page.getByRole("button", { name: "Ver resumen del pedido" }).click();

    // 5. Verificar llegada a /confirmacion con número FM-XXXXXX y enlace a WhatsApp
    await expect(page).toHaveURL(/\/confirmacion/);
    await expect(page.getByRole("heading", { name: "¡Tu pedido fue recibido!" })).toBeVisible();

    const orderNumberLocator = page.locator("main p").filter({ hasText: /^FM-\d{6}$/ });
    await expect(orderNumberLocator).toBeVisible();
    const orderNumber = (await orderNumberLocator.innerText()).trim();
    expect(orderNumber).toMatch(/^FM-\d{6}$/);

    const waLink = page.getByRole("link", { name: /Escribir por WhatsApp/i });
    await expect(waLink).toBeVisible();
    const waHref = await waLink.getAttribute("href");
    expect(waHref).toContain("wa.me/");
    expect(waHref).toContain(orderNumber);
  });
});
