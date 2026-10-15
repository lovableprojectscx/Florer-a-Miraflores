import fs from "node:fs";
import path from "node:path";
import { test, expect, waitForHydration } from "./fixtures";

const EVIDENCIAS_DIR = path.resolve(process.cwd(), "test-results/resenas");
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const ALLOW_WRITES = process.env.E2E_ALLOW_WRITES === "1";

test.describe("Fase 07 — Reseñas y Testimonios E2E", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
  });

  test("Página pública /resenas carga sin errores, con título correcto y sin scroll horizontal", async ({
    page,
  }, testInfo) => {
    await page.goto("/resenas");

    // Verificar título SEO
    await expect(page).toHaveTitle(/Reseñas \| Florería Miraflores/i);

    // Verificar encabezado
    await expect(
      page.getByRole("heading", { name: "Lo que dicen nuestros clientes", level: 1 }),
    ).toBeVisible();

    // Verificar que no hay scroll horizontal indeseado
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Debe mostrar grilla de reseñas o estado vacío digno
    const grid = page.locator('[data-testid="resenas-grid"]');
    const emptyState = page.locator('[data-testid="resenas-empty-state"]');
    const hasGridOrEmpty = (await grid.isVisible()) || (await emptyState.isVisible());
    expect(hasGridOrEmpty).toBe(true);

    // Captura de evidencia mobile (390) y desktop (1440)
    if (testInfo.project.name === "mobile") {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "resenas-390.png"),
        fullPage: false,
      });
    } else {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "resenas-1440.png"),
        fullPage: false,
      });
    }
  });

  test("Footer contiene enlace a /resenas y navega correctamente", async ({ page }) => {
    await page.goto("/");
    const footerLink = page.locator("footer").getByRole("link", { name: "Reseñas" });
    await expect(footerLink).toBeVisible();
    await footerLink.click();
    await expect(page).toHaveURL(/\/resenas/);
  });

  test("Home: la franja de testimonios respeta la regla de visibilidad", async ({ page }) => {
    await page.goto("/");

    const homeSection = page.locator('[data-testid="home-testimonios-section"]');
    // Si la sección es visible, debe contener enlace a /resenas y mínimo 3 tarjetas
    if (await homeSection.isVisible()) {
      const link = homeSection.locator('[data-testid="ver-todas-resenas-link"]');
      await expect(link).toBeVisible();
      const cards = homeSection.locator("article");
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(3);
    } else {
      // Si el toggle está apagado o hay < 3 activas, no debe mostrarse
      await expect(homeSection).toHaveCount(0);
    }
  });

  test("Admin /admin/testimonios: carga panel de gestión y formulario", async ({
    page,
    allowConsoleErrors,
  }, testInfo) => {
    allowConsoleErrors([/testimonios/]);

    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Omitido: requiere credenciales en .env.e2e.local");
    test.setTimeout(90_000);

    await page.goto("/admin-login");
    await page.locator("#email").fill(ADMIN_EMAIL!);
    await page.locator("#password").fill(ADMIN_PASSWORD!);
    await page.locator("#password").press("Enter");

    // Esperar transición a dashboard con reintento si Supabase Auth rate-limita
    const maxLoginAttempts = 3;
    for (let attempt = 1; attempt <= maxLoginAttempts; attempt++) {
      try {
        await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 15_000 });
        break;
      } catch (err) {
        if (attempt < maxLoginAttempts && page.url().includes("/admin-login")) {
          await page.waitForTimeout(5_000);
          await page.locator("#email").fill(ADMIN_EMAIL!);
          await page.locator("#password").fill(ADMIN_PASSWORD!);
          await page.locator("#password").press("Enter");
        } else {
          throw err;
        }
      }
    }
    await expect(page.locator("main h1").first()).toBeVisible();

    // Navegar a testimonios
    const mobileMenuBtn = page.locator("header").getByRole("button", { name: "Abrir menú" });
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(400);
    }
    const navLink = page
      .locator("aside nav")
      .getByRole("link", { name: "Testimonios", exact: true });
    await navLink.scrollIntoViewIfNeeded();
    await navLink.click();

    await expect(page).toHaveURL(/\/admin\/testimonios/);
    await expect(
      page.getByRole("heading", { name: /Gestión de Testimonios/i, level: 1 }),
    ).toBeVisible();

    // Esperar a que termine de cargar
    await expect(page.getByText("Cargando testimonios...")).not.toBeVisible({ timeout: 15_000 });

    // Captura de evidencia del admin
    if (testInfo.project.name === "desktop") {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "admin-testimonios-desktop.png"),
        fullPage: false,
      });

      // Abrir modal de nuevo testimonio si no está bloqueado
      const nuevoBtn = page.getByRole("button", { name: /Nuevo Testimonio/i });
      if (await nuevoBtn.isEnabled()) {
        await nuevoBtn.click();
        await expect(page.getByRole("heading", { name: "Nuevo Testimonio" })).toBeVisible();
        await page.screenshot({
          path: path.join(EVIDENCIAS_DIR, "admin-nuevo-testimonio-modal.png"),
          fullPage: false,
        });
      }
    }
  });

  test("Admin CRUD: solo con E2E_ALLOW_WRITES=1 crea y elimina '[E2E] testimonio'", async ({
    page,
  }) => {
    test.skip(!ALLOW_WRITES, "Omitido: requiere E2E_ALLOW_WRITES=1");
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Requiere credenciales admin");

    await page.goto("/admin-login");
    await page.locator("#email").fill(ADMIN_EMAIL!);
    await page.locator("#password").fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.goto("/admin/testimonios");

    // Abrir modal
    const nuevoBtn = page.getByRole("button", { name: /Nuevo Testimonio/i });
    if (await nuevoBtn.isDisabled()) {
      // Si la tabla no existe aún (SQL 007 pendiente), no se puede escribir
      test.skip(true, "Tabla testimonios aún no existe en BD (SQL 007 pendiente)");
      return;
    }

    await nuevoBtn.click();
    await expect(page.getByRole("heading", { name: "Nuevo Testimonio" })).toBeVisible();

    // Llenar formulario
    const nombreE2E = `[E2E] Testimonio ${Date.now()}`;
    await page.locator('input[placeholder*="María P."]').fill(nombreE2E);
    await page
      .locator('textarea[placeholder*="Copia aquí el texto exacto"]')
      .fill("Reseña de prueba automatizada generada por Playwright E2E.");

    // Guardar
    await page.getByRole("button", { name: /Guardar Testimonio/i }).click();

    // Verificar en lista
    await expect(page.locator("table").getByText(nombreE2E)).toBeVisible();

    // Eliminar para limpieza
    const row = page.locator("table tr", { hasText: nombreE2E });
    await row.locator('button[title="Eliminar"]').click();
    await page.getByRole("button", { name: "Eliminar" }).click();

    // Verificar que ya no existe
    await expect(page.locator("table").getByText(nombreE2E)).toHaveCount(0);
  });
});
