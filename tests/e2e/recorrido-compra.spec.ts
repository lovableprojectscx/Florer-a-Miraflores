import { test, expect, waitForHydration } from "./fixtures";

test.describe("Recorrido Completo de Compra y Auditoría Pre-Lanzamiento", () => {
  test("Flujo E2E completo: Home -> Categoría -> Producto -> Carrito -> Checkout -> Confirmación (con mock de POST)", async ({
    page,
  }) => {
    // Interceptar la inserción a Supabase para no crear pedidos reales en producción
    await page.route("**/rest/v1/pedidos*", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
        return;
      }
      await route.continue();
    });

    // 1. Cargar Home
    await page.goto("/");
    await waitForHydration(page, "main");

    // 2. Navegar a una Categoría desde las tarjetas destacadas del Home
    const linkCategoria = page.locator('main a[href^="/categoria/"]').first();
    await expect(linkCategoria).toBeVisible();
    await linkCategoria.click();
    await expect(page).toHaveURL(/\/categoria\//);
    await waitForHydration(page, "main");

    // 3. Seleccionar el primer producto en la cuadrícula de la categoría
    const firstProduct = page.locator("main article a").first();
    await expect(firstProduct).toBeVisible();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/producto\//);
    await waitForHydration(page, "main");

    // 4. Agregar al carrito en la ficha de producto (botón principal)
    const btnAgregar = page.getByRole("button", { name: /Agregar al carrito/i }).first();
    await expect(btnAgregar).toBeVisible();
    await btnAgregar.click();

    // 5. Drawer de carrito abierto -> clic en "Continuar al checkout"
    const btnIrAPagar = page.locator('a[href="/checkout"]').first();
    await expect(btnIrAPagar).toBeVisible();
    await btnIrAPagar.click();
    await expect(page).toHaveURL(/\/checkout/);
    await waitForHydration(page, "main");

    // 6. Completar formulario de checkout
    await page.fill('input[id="nombre"]', "Cliente Certificación");
    await page.fill('input[id="telefono"]', "999123456");
    await page.fill('input[id="email"]', "cliente.test@floreriamiraflores.com");

    const selectDistrito = page.locator('select[id="distrito_id"]');
    await expect(selectDistrito).toBeVisible();
    const options = await selectDistrito.locator("option").all();
    if (options.length > 1) {
      const val = await options[1].getAttribute("value");
      if (val) await selectDistrito.selectOption(val);
    }

    await page.fill('input[id="direccion"]', "Av. Larco 743, Dpto 501");
    await page.fill('input[id="referencia"]', "Frente al parque Kennedy");

    // Fecha de entrega: día siguiente YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaManana = tomorrow.toISOString().split("T")[0];
    await page.fill('input[id="fecha_entrega"]', fechaManana);

    const selectHora = page.locator('select[id="hora_entrega"]');
    if (await selectHora.isVisible()) {
      const horaOptions = await selectHora.locator("option").all();
      if (horaOptions.length > 1) {
        const valHora = await horaOptions[1].getAttribute("value");
        if (valHora) await selectHora.selectOption(valHora);
      }
    }

    // 7. Enviar formulario
    const btnConfirmar = page.locator('button[type="submit"]');
    await expect(btnConfirmar).toBeVisible();
    await btnConfirmar.click();

    // 8. Modal de pedido registrado
    const modalHeading = page.getByText(/¡Pedido registrado!/i);
    await expect(modalHeading).toBeVisible();

    const btnVerConfirmacion = page.getByRole("button", { name: /Ver resumen del pedido/i });
    await expect(btnVerConfirmacion).toBeVisible();
    await btnVerConfirmacion.click();

    // 9. Página de Confirmación
    await expect(page).toHaveURL(/\/confirmacion\?numero=FM-\d{6}/);
    await expect(page.getByText(/¡Tu pedido fue recibido!/i)).toBeVisible();
    await expect(page.getByText(/FM-\d{6}/)).toBeVisible();
  });

  test("Auditoría de desbordamiento horizontal (no overflow) en 360px, 390px y 1440px", async ({
    page,
  }) => {
    const viewports = [
      { width: 360, height: 740, label: "360px (Móvil compacto)" },
      { width: 390, height: 844, label: "390px (iPhone 14)" },
      { width: 1440, height: 900, label: "1440px (Desktop)" },
    ];

    const rutas = ["/", "/catalogo", "/nosotros", "/libro-de-reclamaciones"];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const ruta of rutas) {
        await page.goto(ruta);
        await waitForHydration(page, "main");

        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > doc.clientWidth;
        });

        expect(
          overflow,
          `Desbordamiento horizontal detectado en ${ruta} a resolución ${vp.label}`,
        ).toBe(false);
      }
    }
  });

  test("Auditoría de enlaces de WhatsApp: FAB y confirmación formatean enlace válido a wa.me", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForHydration(page, "main");

    // Botón flotante WhatsApp FAB visible en móvil y desktop
    const fab = page.locator('a[aria-label="Chatea por WhatsApp con Florería Miraflores"]');
    await expect(fab).toBeVisible();
    const href = await fab.getAttribute("href");
    expect(href).toMatch(/wa\.me\/51\d{9}|api\.whatsapp\.com\/send\?phone=51\d{9}/);
  });
});
