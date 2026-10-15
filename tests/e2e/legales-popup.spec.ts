import { test, expect } from "./fixtures";

test.describe("Fase 10 — Páginas Legales, Footer y Popup sin Cupón", () => {
  const paginasLegales = [
    { ruta: "/terminos", titulo: "Términos y condiciones" },
    { ruta: "/privacidad", titulo: "Política de privacidad" },
    { ruta: "/cambios-y-devoluciones", titulo: "Política de cambios y devoluciones" },
  ];

  for (const { ruta, titulo } of paginasLegales) {
    test(`Página ${ruta} carga con h1 y sin scroll horizontal a 1440px y 390px`, async ({
      page,
    }) => {
      // Desktop: 1440px
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(ruta);

      const h1 = page.locator("h1");
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText(titulo);

      const hasHorizontalScrollDesktop = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScrollDesktop).toBe(false);

      // Mobile: 390px
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(ruta);

      await expect(h1).toBeVisible();
      const hasHorizontalScrollMobile = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScrollMobile).toBe(false);
    });
  }

  test("Footer contiene los 3 enlaces legales y Libro de Reclamaciones", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    const linkTerminos = footer.locator('a[href="/terminos"]');
    const linkPrivacidad = footer.locator('a[href="/privacidad"]');
    const linkCambios = footer.locator('a[href="/cambios-y-devoluciones"]');
    const linkLibro = footer.locator('a[href="/libro-de-reclamaciones"]');

    await expect(linkTerminos).toBeVisible();
    await expect(linkPrivacidad).toBeVisible();
    await expect(linkCambios).toBeVisible();
    await expect(linkLibro).toBeVisible();
  });

  test("Libro de reclamaciones muestra establecimiento exacto y enlace a política de cambios", async ({
    page,
  }) => {
    await page.goto("/libro-de-reclamaciones");
    const h1 = page.locator("h1");
    await expect(h1).toHaveText("Libro de Reclamaciones");

    // Enlace a política de cambios
    const linkCambios = page.locator('main a[href="/cambios-y-devoluciones"]');
    await expect(linkCambios).toBeVisible();

    // Texto de establecimiento
    const establecimiento = page.getByText(
      "Tienda virtual — florer-a-miraflores.vercel.app — Lima, Perú",
    );
    await expect(establecimiento).toBeVisible();
  });

  test("Popup Modal NO contiene ningún cupón ni referencias a MIRAFLORES10", async ({ page }) => {
    // Interceptar configuración de popup para simularlo activo si está inactivo en base
    await page.route("**/rest/v1/popup*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "test-popup",
            activo: true,
            texto: null,
            imagen_url: null,
            fecha_expiracion: null,
          },
        ]),
      });
    });

    await page.goto("/");

    // El popup modal en el DOM no debe contener texto de cupón
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("MIRAFLORES10");
    expect(bodyText).not.toContain("Cupón 10% OFF");
    expect(bodyText).not.toContain("Canjear por WhatsApp");
  });
});
