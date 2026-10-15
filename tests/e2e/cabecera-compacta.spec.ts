import { test, expect, waitForHydration } from "./fixtures";

test.describe("Fase 06-G: Cabecera compacta en páginas de listado", () => {
  const rutas = [
    { ruta: "/catalogo", nombre: "Catálogo", slug: "catalogo" },
    { ruta: "/categoria/tulipanes", nombre: "Tulipanes", slug: "tulipanes" },
    { ruta: "/categoria/ocasion/cumpleanos", nombre: "Cumpleaños", slug: "cumpleanos" },
  ];

  for (const { ruta, nombre } of rutas) {
    test(`[1366x768] ${ruta} tiene primera fila visible sin scroll y título compacto (~32-36px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.goto(ruta);
      await waitForHydration(page, "main select");

      // Verificar que el título h1 existe y tiene tamaño entre 30px y 38px
      const h1 = page.locator("main h1");
      await expect(h1).toBeVisible();
      const fontSize = await h1.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(30);
      expect(fontSize).toBeLessThanOrEqual(38);

      // Verificar que la ruta + eyebrow están en una sola línea integrada
      const navRuta = page.locator('main nav[aria-label="Ruta de navegación"]');
      await expect(navRuta).toBeVisible();
      await expect(navRuta).toContainText("—");

      // Medir la posición de la primera tarjeta de producto sin hacer scroll
      const firstCard = page.locator("main article").first();
      await expect(firstCard).toBeVisible();
      const box = await firstCard.boundingBox();
      expect(box).not.toBeNull();

      // La tarjeta debe comenzar en la parte superior visible (y < 450px)
      // y su parte superior/media estar completamente dentro del viewport de 768px sin scroll
      expect(box!.y).toBeGreaterThan(0);
      expect(box!.y).toBeLessThan(450);
      expect(box!.y + 150).toBeLessThan(768);
    });

    test(`[1440x900] ${ruta} tiene primera fila visible sin scroll`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(ruta);
      await waitForHydration(page, "main select");

      const firstCard = page.locator("main article").first();
      await expect(firstCard).toBeVisible();
      const box = await firstCard.boundingBox();
      expect(box).not.toBeNull();

      expect(box!.y).toBeGreaterThan(0);
      expect(box!.y).toBeLessThan(450);
      // En 1440x900 la tarjeta completa suele caber en el viewport inicial
      expect(box!.y + box!.height).toBeLessThan(900);
    });

    test(`[390x844] ${ruta} tiene título móvil compacto (~24-26px)`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(ruta);
      await waitForHydration(page, "main select");

      const h1 = page.locator("main h1");
      await expect(h1).toBeVisible();
      const fontSize = await h1.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(22);
      expect(fontSize).toBeLessThanOrEqual(28);
    });
  }
});
