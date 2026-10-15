import fs from "node:fs";
import path from "node:path";
import { test, expect } from "./fixtures";

const EVIDENCIAS_DIR = path.resolve(process.cwd(), "test-results/recuerdos");

test.describe("Mural de Recuerdos E2E", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
  });

  test("Página pública /recuerdos carga correctamente con mensaje si está vacía y sin scroll horizontal", async ({
    page,
  }, testInfo) => {
    await page.goto("/recuerdos");

    // Verificar título SEO
    await expect(page).toHaveTitle(/Mural de Recuerdos .* Florería Miraflores/i);

    // Encabezado principal
    await expect(page.getByRole("heading", { name: "Mural de Recuerdos", level: 1 })).toBeVisible();

    // Sin desbordamiento horizontal
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Si no hay recuerdos publicados, debe mostrar el mensaje respetuoso
    const emptyHeading = page.getByRole("heading", {
      name: /Pronto compartiremos nuestras entregas/i,
    });
    const articles = page.locator("article");
    const count = await articles.count();

    if (count === 0) {
      await expect(emptyHeading).toBeVisible();
    } else {
      expect(count).toBeGreaterThan(0);
    }

    // Captura de evidencia mobile y desktop en test-results (sin tocar docs/evidencias)
    if (testInfo.project.name === "mobile") {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "recuerdos-mural-390.png"),
        fullPage: false,
      });
    } else {
      await page.screenshot({
        path: path.join(EVIDENCIAS_DIR, "recuerdos-mural-1440.png"),
        fullPage: false,
      });
    }
  });

  test("Redirección 301: /blog redirige automáticamente a /recuerdos", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveURL(/\/recuerdos/);
  });

  test("Footer contiene enlace a 'Mural de Recuerdos' y navega a /recuerdos", async ({ page }) => {
    await page.goto("/");
    const footerLink = page.locator("footer").getByRole("link", { name: /Mural de Recuerdos/i });
    await expect(footerLink).toBeVisible();
    await footerLink.click();
    await expect(page).toHaveURL(/\/recuerdos/);
  });

  test("Recuerdo inexistente o no publicado devuelve 404 limpio", async ({
    page,
    allowConsoleErrors,
  }) => {
    allowConsoleErrors([/recuerdos/, /404/]);

    await page.goto("/recuerdos/recuerdo-ficticio-que-no-existe-xyz-404");

    // Componente 404 de recuerdo
    await expect(
      page.getByRole("heading", { name: "Recuerdo no encontrado", level: 1 }),
    ).toBeVisible();

    // Enlace para volver
    const backLink = page.getByRole("link", { name: "Volver al Mural de Recuerdos" });
    await expect(backLink).toBeVisible();
  });
});
