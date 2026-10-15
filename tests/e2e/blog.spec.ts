import fs from "node:fs";
import path from "node:path";
import { test, expect } from "./fixtures";

const EVIDENCIAS_DIR = path.resolve(process.cwd(), "docs/evidencias/fase-09");
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const ALLOW_WRITES = process.env.E2E_ALLOW_WRITES === "1";

test.describe("Fase 09 — Blog E2E", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
  });

  test("Página pública /blog carga sin errores, con título y sin scroll horizontal", async ({
    page,
    allowConsoleErrors,
  }, testInfo) => {
    allowConsoleErrors([/blog_posts/]);

    await page.goto("/blog");

    // Verificar título SEO
    await expect(page).toHaveTitle(/Blog .* Florería Miraflores/i);

    // Verificar encabezado
    await expect(page.getByRole("heading", { name: "Blog de Flores", level: 1 })).toBeVisible();

    // Verificar que no hay scroll horizontal indeseado
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Debe mostrar la grilla de artículos o el estado vacío digno
    const articles = page.locator("article");
    const emptyState = page.locator('[data-testid="blog-empty-state"]');
    const count = await articles.count();
    const hasArticlesOrEmpty = count > 0 || (await emptyState.isVisible());
    expect(hasArticlesOrEmpty).toBe(true);

    // Captura de evidencia mobile (390) y desktop (1440)
    if (testInfo.project.name === "mobile") {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "blog-listado-390.png"),
        fullPage: false,
      });
    } else {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "blog-listado-1440.png"),
        fullPage: false,
      });
    }
  });

  test("Footer contiene enlace a /blog y navega correctamente", async ({ page }) => {
    await page.goto("/");
    const footerLink = page.locator("footer").getByRole("link", { name: "Blog", exact: true });
    await expect(footerLink).toBeVisible();
    await footerLink.click();
    await expect(page).toHaveURL(/\/blog/);
  });

  test("Artículo inexistente devuelve 404 limpio", async ({ page, allowConsoleErrors }) => {
    allowConsoleErrors([/blog_posts/, /404/]);

    await page.goto("/blog/articulo-que-no-existe-xyz-404");

    // Debe mostrar componente 404 de artículo
    await expect(
      page.getByRole("heading", { name: "Artículo no encontrado", level: 1 }),
    ).toBeVisible();

    // Enlace para volver al blog
    const backLink = page.getByRole("link", { name: "Volver al Blog" });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/blog/);
  });

  test("Artículo público: carga contenido si hay publicado o skip si no hay artículos", async ({
    page,
    allowConsoleErrors,
  }, testInfo) => {
    allowConsoleErrors([/blog_posts/]);

    await page.goto("/blog");

    // Verificar si existen artículos publicados en el catálogo del blog
    const articleLink = page.locator("main article a[href^='/blog/']").first();
    const hasPublishedArticles = (await articleLink.count()) > 0;

    if (!hasPublishedArticles) {
      test.skip(
        true,
        "Omitido: no hay artículos publicados en BD (Sofía aún no ha publicado artículos)",
      );
      return;
    }

    await articleLink.click();
    await page.waitForLoadState("domcontentloaded");

    // Verificar título y cabecera del artículo cargado
    await expect(page.locator("main h1")).toBeVisible();

    // Verificar que no hay scroll horizontal indeseado
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Captura de evidencia del artículo a 390 y 1440
    if (testInfo.project.name === "mobile") {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "blog-articulo-390.png"),
        fullPage: false,
      });
    } else {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "blog-articulo-1440.png"),
        fullPage: false,
      });
    }
  });

  test("Admin /admin/blog: carga panel de gestión y modal de nuevo artículo", async ({
    page,
    allowConsoleErrors,
  }, testInfo) => {
    allowConsoleErrors([/blog_posts/]);

    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Omitido: requiere credenciales en .env.e2e.local");
    test.setTimeout(90_000);

    await page.goto("/admin-login");
    await page.locator("#email").fill(ADMIN_EMAIL!);
    await page.locator("#password").fill(ADMIN_PASSWORD!);
    await page.locator("#password").press("Enter");

    // Esperar transición al dashboard
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
    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 15_000 });

    // Navegar a /admin/blog
    const mobileMenuBtn = page.locator("header").getByRole("button", { name: "Abrir menú" });
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);
    }
    const navLink = page.locator("aside nav").getByRole("link", { name: "Blog", exact: true });
    await navLink.scrollIntoViewIfNeeded();
    await navLink.click();

    await expect(page).toHaveURL(/\/admin\/blog/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /Blog de Flores/i, level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    // En móvil, asegurar que el menú lateral haya terminado de cerrarse
    if (await mobileMenuBtn.isVisible()) {
      await page.waitForTimeout(400);
    }

    // Captura de evidencia del panel de administración
    if (testInfo.project.name === "desktop") {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "admin-blog-desktop-1440.png"),
        fullPage: false,
      });
    } else {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "admin-blog-mobile-390.png"),
        fullPage: false,
      });
    }

    // Abrir modal de nuevo artículo
    const nuevoBtn = page.getByRole("button", { name: /Nuevo artículo/i });
    if (await nuevoBtn.isVisible()) {
      await nuevoBtn.click();
      await expect(page.getByRole("heading", { name: "Nuevo Artículo de Blog" })).toBeVisible({
        timeout: 10_000,
      });

      // Captura del editor
      if (testInfo.project.name === "desktop") {
        await page.screenshot({
          path: path.join(EVIDENCIAS_DIR, "admin-blog-editor-1440.png"),
          fullPage: false,
        });
      } else {
        await page.screenshot({
          path: path.join(EVIDENCIAS_DIR, "admin-blog-editor-390.png"),
          fullPage: false,
        });
      }
    }
  });

  test("Admin CRUD: solo con E2E_ALLOW_WRITES=1 crea y elimina '[E2E] artículo'", async ({
    page,
    allowConsoleErrors,
  }) => {
    allowConsoleErrors([/blog_posts/]);

    test.skip(!ALLOW_WRITES, "Omitido: requiere E2E_ALLOW_WRITES=1");
    test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Requiere credenciales admin");

    await page.goto("/admin-login");
    await page.locator("#email").fill(ADMIN_EMAIL!);
    await page.locator("#password").fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.goto("/admin/blog");

    // Si la tabla no existe aún (SQL 008 pendiente), omitir escritura
    const tableMissingAlert = page.getByText(/Falta correr el SQL 008/i);
    if (await tableMissingAlert.isVisible()) {
      test.skip(true, "Tabla blog_posts aún no existe en BD (SQL 008 pendiente de aprobación)");
      return;
    }

    // Abrir modal
    const nuevoBtn = page.getByRole("button", { name: /Nuevo artículo/i });
    await nuevoBtn.click();
    await expect(page.getByRole("heading", { name: "Nuevo Artículo de Blog" })).toBeVisible();

    // Llenar formulario
    const idUnico = Date.now();
    const tituloE2E = `[E2E] Guía Floral ${idUnico}`;
    await page.locator('input[placeholder*="Significado de los colores"]').fill(tituloE2E);
    await page
      .locator('textarea[placeholder*="Breve introducción"]')
      .fill("Resumen generado por E2E.");
    await page
      .locator('textarea[placeholder*="Escribe el artículo en Markdown"]')
      .fill(
        "## Sección de Prueba\n\nEste es un artículo generado automáticamente por pruebas E2E.",
      );

    // Guardar
    await page.getByRole("button", { name: /Guardar Artículo/i }).click();

    // Verificar en lista
    await expect(page.locator("table").getByText(tituloE2E)).toBeVisible();

    // Eliminar con modal de confirmación propio para limpieza
    const row = page.locator("table tr", { hasText: tituloE2E });
    await row.locator('button[title="Eliminar artículo"]').click();

    // Confirmar en el modal propio
    await expect(page.getByRole("heading", { name: "¿Eliminar artículo?" })).toBeVisible();
    await page.getByRole("button", { name: "Eliminar" }).click();

    // Verificar que ya no existe
    await expect(page.locator("table").getByText(tituloE2E)).toHaveCount(0);
  });
});
