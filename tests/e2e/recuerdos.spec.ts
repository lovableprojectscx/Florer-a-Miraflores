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

  test("Home: la franja 'Recuerdos de entrega' se renderiza con recuerdos publicados y enlace a /recuerdos", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="home-recuerdos-section"]');
    await expect(section).toBeVisible();

    const heading = section.getByRole("heading", { name: /Recuerdos de entrega/i, level: 2 });
    await expect(heading).toBeVisible();

    const verTodos = section.locator('[data-testid="ver-todos-recuerdos-link"]');
    await expect(verTodos).toBeVisible();
    await expect(verTodos).toHaveAttribute("href", "/recuerdos");
  });

  test("Calidad visual (RNF-10 y RNF-11): tarjetas de recuerdos con altura uniforme y punto focal superior", async ({
    page,
  }) => {
    await page.goto("/");
    const section = page.locator('[data-testid="home-recuerdos-section"]');
    await expect(section).toBeVisible();

    const cards = section.locator("article");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Verificar RNF-10: las imágenes tienen object-position al 18% para no recortar cabezas ni globos
    const firstImg = cards.first().locator("img");
    await expect(firstImg).toBeVisible();
    const objectPos = await firstImg.evaluate((el) => window.getComputedStyle(el).objectPosition);
    expect(objectPos).toContain("18%");

    // Verificar RNF-11: las tarjetas contiguas tienen la misma altura milimétrica
    if (count >= 2) {
      const box1 = await cards.nth(0).boundingBox();
      const box2 = await cards.nth(1).boundingBox();
      if (box1 && box2) {
        expect(Math.abs(box1.height - box2.height)).toBeLessThanOrEqual(2);
      }
    }
  });
});
