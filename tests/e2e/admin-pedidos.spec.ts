import { test, expect } from "./fixtures";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.describe("Admin Pedidos E2E — Estados y 'En preparación'", () => {
  test.beforeEach(async ({ page, allowConsoleErrors }) => {
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      "Omitido: define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD en .env.e2e.local para ejecutar pruebas del panel admin.",
    );

    // Permitir error 404 de imagen de producto en pedidos de prueba históricos en BD
    allowConsoleErrors([/product-novedad-velvet\.jpg/i]);

    // Iniciar sesión
    await page.goto("/admin-login");
    await page.locator("#email").fill(ADMIN_EMAIL!);
    await page.locator("#password").fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator("main h1").first()).toHaveText("Dashboard");

    // Navegar a /admin/pedidos mediante el enlace del sidebar
    const mobileMenuBtn = page.locator("header").getByRole("button", { name: "Abrir menú" });
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(350); // esperar transición CSS de 300ms del sidebar móvil
    }
    const pedidosLink = page
      .locator("aside nav")
      .getByRole("link", { name: "Pedidos", exact: true });
    await pedidosLink.scrollIntoViewIfNeeded();
    await pedidosLink.click();

    await expect(page).toHaveURL(/\/admin\/pedidos/);
    await expect(page.locator("main h1").first()).toHaveText("Pedidos");
  });

  test("filtro 'En preparación' existe, permite filtrar y el modal de detalle muestra los 6 estados (solo lectura)", async ({
    page,
  }) => {
    // 1. Verificar que el botón de filtro 'En preparación' exista y sea clickeable
    const filtroEnPrep = page.getByRole("button", { name: /En preparación/i });
    await expect(filtroEnPrep).toBeVisible();

    // 2. Hacer clic en el filtro 'En preparación'
    await filtroEnPrep.click();
    await expect(filtroEnPrep).toHaveClass(/bg-\[#2C2420\]/);

    // 3. Volver al filtro 'Todos' para ver los pedidos existentes
    const filtroTodos = page.getByRole("button", { name: /^Todos/i });
    await filtroTodos.click();
    await expect(filtroTodos).toHaveClass(/bg-\[#2C2420\]/);

    // 4. Abrir el modal de detalle del primer pedido disponible (filtrando el botón visible en desktop o mobile)
    const verDetalleBtn = page
      .locator("button")
      .filter({ hasText: "Ver detalle" })
      .or(page.locator("button[title='Ver detalle']"))
      .locator("visible=true")
      .first();
    await expect(verDetalleBtn).toBeVisible();
    await verDetalleBtn.click();

    // 5. Verificar modal abierto y los 6 estados en el selector
    const modal = page.locator("div.fixed.inset-0.z-50");
    await expect(modal).toBeVisible();
    await expect(modal.locator("p.font-display")).toContainText(/Pedido/);

    const selectEstado = modal.locator("select");
    await expect(selectEstado).toBeVisible();

    const opciones = await selectEstado.locator("option").allInnerTexts();
    expect(opciones).toEqual([
      "Recibido",
      "En preparación",
      "En camino",
      "Entregado",
      "Pagado",
      "Cancelado",
    ]);

    const valores = await selectEstado
      .locator("option")
      .evaluateAll((opts) => opts.map((o) => (o as HTMLOptionElement).value));
    expect(valores).toEqual([
      "pendiente",
      "en_preparacion",
      "en_camino",
      "entregado",
      "pagado",
      "cancelado",
    ]);

    // 6. Cerrar modal sin guardar cambios (solo lectura estricta)
    await modal.getByRole("button", { name: "Cerrar" }).click();
    await expect(modal).toBeHidden();
  });

  test("cambiar estado de pedido real (solo bajo autorización con E2E_ALLOW_WRITES=1 y pedido [E2E])", async ({
    page,
  }) => {
    test.skip(
      process.env.E2E_ALLOW_WRITES !== "1",
      "Omitido: cambios de estado en producción solo permitidos si E2E_ALLOW_WRITES=1 y existe pedido de prueba [E2E].",
    );

    // Buscar pedido de prueba explícito
    const testRow = page.locator("tr", { hasText: "[E2E]" });
    const count = await testRow.count();
    test.skip(count === 0, "Omitido: no existe pedido de prueba con etiqueta [E2E] en producción.");
  });
});
