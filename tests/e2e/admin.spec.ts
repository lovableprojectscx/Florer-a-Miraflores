import { test, expect } from "./fixtures";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

const SIDEBAR_SECTIONS = [
  { label: "Dashboard", urlPart: "/admin/dashboard" },
  { label: "Productos", urlPart: "/admin/productos" },
  { label: "Categorias", urlPart: "/admin/categorias" },
  { label: "Banners", urlPart: "/admin/banners" },
  { label: "Testimonios", urlPart: "/admin/testimonios" },
  { label: "Popup", urlPart: "/admin/popup" },
  { label: "Colecciones Home", urlPart: "/admin/colecciones-home" },
  { label: "Ocasiones Home", urlPart: "/admin/ocasiones" },
  { label: "Distritos", urlPart: "/admin/distritos" },
  { label: "Tags", urlPart: "/admin/tags" },
  { label: "Pedidos", urlPart: "/admin/pedidos" },
  { label: "Reclamaciones", urlPart: "/admin/reclamaciones" },
  { label: "Configuracion", urlPart: "/admin/config" },
];

test.describe("Admin E2E — Protección de ruta y navegación", () => {
  test("/admin sin sesión redirige automáticamente al login (/admin-login)", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin-login/);
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("con credenciales: login exitoso y el sidebar navega a cada sección sin errores (solo lectura)", async ({
    page,
    allowConsoleErrors,
  }) => {
    allowConsoleErrors([/testimonios/]);
    test.skip(
      !ADMIN_EMAIL || !ADMIN_PASSWORD,
      "Omitido: define E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD en .env.e2e.local para ejecutar las pruebas autenticadas del panel admin.",
    );

    test.setTimeout(90_000);

    await page.goto("/admin-login");
    await page.locator("#email").fill(ADMIN_EMAIL!);
    await page.locator("#password").fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(page.locator("main h1").first()).toBeVisible();

    for (const section of SIDEBAR_SECTIONS) {
      const mobileMenuBtn = page.locator("header").getByRole("button", { name: "Abrir menú" });
      if (await mobileMenuBtn.isVisible()) {
        await mobileMenuBtn.click();
        await page.waitForTimeout(350);
      }
      const sectionLink = page
        .locator("aside nav")
        .getByRole("link", { name: section.label, exact: true });
      await sectionLink.scrollIntoViewIfNeeded();
      await sectionLink.click();
      await expect(page).toHaveURL(new RegExp(section.urlPart));
      await expect(
        page.locator("main h1").first(),
        `La sección ${section.label} (${section.urlPart}) debe renderizar su encabezado principal`,
      ).toBeVisible();
    }
  });
});
