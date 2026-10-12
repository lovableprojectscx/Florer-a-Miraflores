import fs from "node:fs";
import path from "node:path";
import { test, expect } from "./fixtures";

const EVIDENCIAS_DIR = path.resolve(process.cwd(), "docs/evidencias/fase-01");

test.describe("Smoke E2E — Rutas públicas", () => {
  test("Home (/) carga sin errores y tiene <title> correcto", async ({ page }, testInfo) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Florería Miraflores/i);
    await expect(page.locator("header")).toBeVisible();
    fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(EVIDENCIAS_DIR, `home-${testInfo.project.name}.png`),
    });
  });

  test("Catálogo (/catalogo) carga sin errores y tiene <title> correcto", async ({
    page,
  }, testInfo) => {
    await page.goto("/catalogo");
    await expect(page).toHaveTitle(/Catálogo \| Florería Miraflores/i);
    await expect(page.getByRole("heading", { name: "Catálogo", level: 1 })).toBeVisible();
    fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
    await page.screenshot({
      path: path.join(EVIDENCIAS_DIR, `catalogo-${testInfo.project.name}.png`),
    });
  });

  test("Nosotros (/nosotros) carga sin errores y tiene <title> correcto", async ({ page }) => {
    await page.goto("/nosotros");
    await expect(page).toHaveTitle(/Sobre Nosotros \| Florería Miraflores/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Libro de Reclamaciones (/libro-de-reclamaciones) carga sin errores y tiene <title> correcto", async ({
    page,
  }) => {
    await page.goto("/libro-de-reclamaciones");
    await expect(page).toHaveTitle(/Libro de Reclamaciones/i);
    await expect(
      page.getByRole("heading", { name: /Libro de Reclamaciones/i, level: 1 }),
    ).toBeVisible();
  });

  test("Categoría real (/categoria/:slug) y Producto real (/producto/:id) extraídos del catálogo cargan con <title> correcto", async ({
    page,
  }) => {
    await page.goto("/catalogo");

    // Extraer un link de categoría real desde el DOM (Header)
    const catHref = await page.locator('a[href^="/categoria/"]').first().getAttribute("href");
    expect(catHref).toBeTruthy();
    // Asegurar ruta padre /categoria/:slug
    const parts = catHref!.split("/").filter(Boolean);
    const parentCatPath = `/${parts[0]}/${parts[1]}`;

    // Extraer un link de producto real desde las tarjetas del catálogo
    const firstProductLink = page.locator('main article a[href^="/producto/"]').first();
    await expect(firstProductLink).toBeVisible();
    const prodHref = await firstProductLink.getAttribute("href");
    expect(prodHref).toBeTruthy();

    // Visitar categoría real
    await page.goto(parentCatPath);
    await expect(page).toHaveTitle(/\| Florería Miraflores/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Visitar producto real
    await page.goto(prodHref!);
    await expect(page).toHaveTitle(/\| Florería Miraflores/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Ruta inexistente muestra mensaje de no encontrado", async ({ page }) => {
    await page.goto("/categoria/categoria-inexistente-e2e-404");
    await expect(page.getByRole("heading", { name: /no encontrad[oa]/i })).toBeVisible();

    await page.goto("/ruta-inexistente-e2e-404");
    await expect(
      page.getByRole("heading", { name: /not found|no encontrad[oa]|404/i }).first(),
    ).toBeVisible();
  });
});
