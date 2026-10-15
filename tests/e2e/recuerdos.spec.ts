import fs from "node:fs";
import path from "node:path";
import { test, expect } from "./fixtures";

const EVIDENCIAS_DIR = path.resolve(process.cwd(), "test-results/recuerdos");

test.describe("Mural de Recuerdos E2E", () => {
  test.beforeAll(() => {
    fs.mkdirSync(EVIDENCIAS_DIR, { recursive: true });
  });

  test("Página pública /recuerdos carga con título, tarjetas y sin scroll horizontal", async ({
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

    // Debe mostrar tarjetas de recuerdos
    const articles = page.locator("article");
    const count = await articles.count();
    expect(count).toBeGreaterThan(0);

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

  test("Detalle de recuerdo público carga foto, bloque de compra y enlace a WhatsApp", async ({
    page,
  }) => {
    await page.goto("/recuerdos/sorpresa-cumpleanos-globos-flores");

    // Título y encabezado
    await expect(
      page.getByRole("heading", { name: /Sorpresa de Cumpleaños/i, level: 1 }),
    ).toBeVisible();

    // Foto de entrega visible
    const img = page.locator("main img[alt*='Sorpresa de Cumpleaños']").first();
    await expect(img).toBeVisible();

    // Bloque de conversión: arreglo del recuerdo
    await expect(page.getByText(/Arreglo floral de este recuerdo/i)).toBeVisible();

    // Botones de acción directa
    const btnCarrito = page.getByRole("button", { name: /Agregar al carrito/i }).first();
    await expect(btnCarrito).toBeVisible();

    const btnWhatsapp = page.getByRole("link", { name: /Pedir por WhatsApp/i });
    await expect(btnWhatsapp).toBeVisible();
    const href = await btnWhatsapp.getAttribute("href");
    expect(href).toContain("wa.me");
    expect(href).toContain(encodeURIComponent("sorpresa-cumpleanos-globos-flores"));
  });

  test("Recuerdo inexistente devuelve 404 limpio", async ({ page, allowConsoleErrors }) => {
    allowConsoleErrors([/recuerdos/, /404/]);

    await page.goto("/recuerdos/recuerdo-ficticio-que-no-existe-xyz-404");

    // Componente 404 de recuerdo
    await expect(
      page.getByRole("heading", { name: "Recuerdo no encontrado", level: 1 }),
    ).toBeVisible();

    // Enlace para volver
    const backLink = page.getByRole("link", { name: "Volver al Mural de Recuerdos" });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/recuerdos/);
  });
});
